FROM debian:12.9

RUN apt update && apt install -y \
    curl \
    git \
    wget \
    sudo \
    build-essential \
    libssl-dev \
    libpq-dev \
    bash \
    ruby-dev \
    ruby

RUN useradd -ms /bin/bash webster

RUN mkdir /logenhelfer

RUN chown -R webster /logenhelfer

RUN gem install bundler

# USER webster

COPY . /logenhelfer

WORKDIR /logenhelfer

CMD sh -c "echo 'Inside Container:' && echo 'User: $(whoami) UID: $(id -u) GID: $(id -g)'"

# RUN bundle install

EXPOSE 9876

COPY --chmod=755 ./entrypoint.sh /logenhelfer/entrypoint.sh

#ENTRYPOINT [ "./entrypoint.sh" ]

CMD [ "/bin/bash" ]