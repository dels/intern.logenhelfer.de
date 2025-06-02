FROM ruby:3.4.4-slim AS logenhelgfer

# Set environment variables for bundler
ENV BUNDLER_VERSION=2.6.9 \
    LANG=C.UTF-8 \
    RAILS_ENV=development \
    NODE_ENV=development

WORKDIR /app

# Install system dependencies for gems, NodeJS, Yarn, and more
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      nodejs \
      yarn \
      git \
      libxml2-dev \
      libxslt1-dev \
      zlib1g-dev \
      tzdata \
      curl \
      gnupg2 \
      imagemagick \
  && rm -rf /var/lib/apt/lists/*


# (Optional: Install correct version of bundler)
RUN gem install bundler -v "$BUNDLER_VERSION"

# Copy Gemfiles first (better layer caching)
COPY Gemfile Gemfile.lock ./

# Install Ruby gems
RUN bundle install

# Copy the rest of the app source
COPY . .

# Precompile assets if needed (uncomment for production)
RUN bundle exec rails assets:precompile

EXPOSE 9876

COPY --chmod=755 ./entrypoint.sh /logenhelfer/entrypoint.sh

# ENTRYPOINT [ "./entrypoint.sh" ]

CMD [ "bundle", "exec", "puma", "start" ]