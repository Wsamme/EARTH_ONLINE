# Local static test server: absent optional favicon has a successful empty response.
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path=='/favicon.ico':
   self.send_response(204);self.end_headers();return
  super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8048),partial(Handler,directory=str(Path(__file__).resolve().parents[1]/'site'))).serve_forever()
