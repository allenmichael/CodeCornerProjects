import os
import multiprocessing

port = os.environ.get("PORT", "5001")
bind = f'0.0.0.0:{int(port)}'
pidfile = 'card-image-api.pid'
worker_class = 'gthread'
workers = multiprocessing.cpu_count() * 3 + 1
timeout = 30
keepalive = 5
threads = multiprocessing.cpu_count() * 3 + 1
proc_name = 'wsgi:app'
backlog = 2048
errorlog = "-"
accesslog = "-"
user = None
group = None
worker_tmp_dir = "/dev/shm"
graceful_timeout = 120
