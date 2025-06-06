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

RUN rm -fR node_modules

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
    && apt-get install -y nodejs

RUN npm install -g pnpm --force

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm install

RUN pnpm run build

# (Optional: Install correct version of bundler)
RUN gem install bundler -v "$BUNDLER_VERSION"

# Install Ruby gems
RUN bundle install

# Precompile assets if needed (uncomment for production)
RUN RAILS_ENV=$RAILS_ENV bundle exec rails assets:clobber
RUN RAILS_ENV=$RAILS_ENV bundle exec rails assets:precompile

EXPOSE 9876

CMD [ "bundle", "exec", "puma", "-C", "config/puma.rb" ]