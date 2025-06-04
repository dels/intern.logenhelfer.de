FROM ruby:3.4.4-slim AS logenhelgfer

# Set environment variables for bundler
ENV BUNDLER_VERSION=2.6.9 \
    LANG=C.UTF-8 \
    RAILS_ENV=fwze \
    NODE_ENV=production

WORKDIR /app

# Copy Gemfiles first (better layer caching)
COPY Gemfile Gemfile.lock ./

# Copy the rest of the app source
COPY . .

# Install system dependencies for gems, NodeJS, Yarn, and more
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      git \
      libxml2-dev \
      libxslt1-dev \
      zlib1g-dev \
      tzdata \
      curl \
      gnupg2 \
      imagemagick \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js from NodeSource (includes corepack)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && corepack enable \
    && corepack prepare yarn@stable --activate

# (Optional) Show versions
RUN node --version && yarn --version

# (Optional: Install correct version of bundler)
RUN gem install bundler -v "$BUNDLER_VERSION"

# Install Ruby gems
RUN bundle install

RUN npm install -g yarn --force

RUN corepack enable && corepack prepare yarn@stable --activate

# Precompile assets if needed (uncomment for production)
RUN bundle exec rails assets:precompile

EXPOSE 9876

# COPY --chmod=755 ./entrypoint.sh /logenhelfer/entrypoint.sh

# ENTRYPOINT [ "./entrypoint.sh" ]

# CMD ["echo", "Hello, World!"]

CMD [ "bundle", "exec", "puma", "-C", "config/puma.rb" ]