FROM debian:12.9

RUN apt update && apt install -y \
  iputils-ping \
  iproute2 \
  curl \
  git \
  wget \
  sudo \
  build-essential \
  libssl-dev \
  libpq-dev \
  bash \
  libssl-dev \
  rbenv \
	bison \
	dpkg-dev \
	libgdbm-dev \
	autoconf \
	bzip2 \
	g++ \
	gcc \
	libbz2-dev \
	libffi-dev \
	libgdbm-compat-dev \
	libglib2.0-dev \
	libgmp-dev \
	libncurses-dev \
	libreadline-dev \
	libxml2-dev \
	libxslt-dev \
	libyaml-dev \
	make \
	xz-utils \
	zlib1g-dev \
  ruby-build \
  ruby-dev \
  ruby

RUN apt update && apt upgrade -y && \
    apt install -y nodejs \
    npm

RUN wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_amd64.deb -O /tmp/libssl1.1_1.1.1n-0+deb10u6_amd64.deb
RUN dpkg -i /tmp/libssl1.1_1.1.1n-0+deb10u6_amd64.deb

RUN wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl-dev_1.1.1n-0+deb10u6_amd64.deb -O /tmp/libssl-dev_1.1.1n-0+deb10u6_amd64.deb
RUN dpkg -i /tmp/libssl-dev_1.1.1n-0+deb10u6_amd64.deb

# RUN rbenv install 2.7.6
RUN rbenv install 2.7.6

RUN rbenv global 2.7.6

RUN rbenv rehash

RUN useradd -ms /bin/bash webster

RUN mkdir /logenhelfer

RUN chown -R webster /logenhelfer

ENV PATH "/root/.rbenv/shims/:/root/.rbenv/shims/:$PATH"

# USER webster

COPY . /logenhelfer

WORKDIR /logenhelfer

EXPOSE 9876

COPY --chmod=755 ./entrypoint.sh /logenhelfer/entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]

#CMD [ "/bin/bash" ]