FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8-slim as base

COPY src/requirements.txt .
RUN apt-get update \
    && apt-get clean \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt 

COPY src/ /app
WORKDIR /app
RUN pip install -r requirements.txt

FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8-slim

RUN apt-get update \
    && apt-get clean \
    && groupadd python \
    && useradd --no-log-init -g python python 

COPY --from=base --chown=python:python /app/ /app
COPY --from=base --chown=python:python /usr/local/lib/python3.8 /usr/local/lib/python3.8
COPY --from=base --chown=python:python /usr/local/bin/gunicorn /usr/local/bin/gunicorn
WORKDIR /app

USER python
RUN python -c "import matplotlib.pyplot"

CMD ["gunicorn", "-c", "gunicorn.py", "app:create_app()"]

# FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8 as builder

# # WORKDIR /app

# ARG UID=1000
# ARG GID=1000

# COPY src/requirements.txt .
# RUN apt-get update \
#     && apt-get clean \
#     && mkdir -p /home/python/server \
#     && pip install --upgrade pip \
#     && pip install --no-cache-dir -r requirements.txt 
#     # && pip install --no-cache-dir --target=/home/python/server/dependencies -r requirements.txt 

# WORKDIR /home/python/server
# COPY --chown=python:python src/ .

# # FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8-slim-buster as prod

# # COPY --from=builder --chown=python:python /home/python/server /home/python/server 

# # RUN apt-get update \
# #     && apt-get clean \
# #     && groupadd python \
# #     && useradd --no-log-init -g python python \
# #     && pip install gunicorn \
# #     && chown python:python -R /home/python/server

# WORKDIR /home/python/server
# USER python

# ENV PYTHONPATH="${PYTHONPATH}:/home/python/server/dependencies"
# RUN python -c "import matplotlib.pyplot"

# CMD ["gunicorn", "-c", "gunicorn.py", "app:create_app()"]

# # FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8.9-alpine3.13 as pythonBuilder
# # RUN mkdir -p /home/python/server && \
# #     apk update && apk add --update gcc libc-dev linux-headers libusb-dev

# # WORKDIR /home/python/server
# # COPY ./src .
# # RUN pip install --target=/home/python/server/dependencies -r requirements.txt

# # FROM --platform=linux/amd64 public.ecr.aws/docker/library/python:3.8.9-alpine3.13
# # WORKDIR /home/python/server
# # RUN apk update && apk add libusb-dev && \
# #     adduser -D python
# # COPY --from=pythonBuilder --chown=python:python /home/python/server .
# # ENV PYTHONPATH="${PYTHONPATH}:/home/python/server/dependencies"

# # USER python
# # RUN python -c "import matplotlib.pyplot"

# # CMD ["gunicorn", "-c", "gunicorn.py", "app:create_app()"]