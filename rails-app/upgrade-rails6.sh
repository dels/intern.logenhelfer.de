#!/bin/bash
set -e

echo "==[ Rails 6 Upgrade Script: Automated Steps ]=="
echo

echo "1. Backing up your Gemfile and Gemfile.lock..."
cp Gemfile Gemfile.bak
cp Gemfile.lock Gemfile.lock.bak || true

echo "2. Updating Rails and related gems in Gemfile..."
# Replace rails, sprockets, sprockets-rails, sass-rails to Rails 6.x compatible versions
sed -i 's/^gem '\''rails.*$/gem '\''rails'\'', '\''~> 6.1.7'\''/' Gemfile
sed -i 's/^gem '\''sprockets.*$/gem '\''sprockets'\'', '\''~> 4.0'\''/' Gemfile
sed -i 's/^gem '\''sprockets-rails.*$/gem '\''sprockets-rails'\'', '\''~> 3.4'\''/' Gemfile
sed -i 's/^gem '\''sass-rails.*$/gem '\''sass-rails'\'', '\''~> 6.0'\''/' Gemfile
# Remove puma-daemon if present; not compatible with puma >= 5
sed -i '/gem '\''puma-daemon.*$/d' Gemfile

echo "3. Updating puma version..."
sed -i "s/^gem 'puma.*$/gem 'puma', '~> 5.0'/" Gemfile

echo "4. Running bundle update..."
bundle update rails sprockets sprockets-rails sass-rails puma

echo "5. Running 'rails app:update' (will prompt for overwriting some files)..."
RAILS_ENV=development bundle exec rails app:update

echo
echo "==[ Important: Manual Steps Remain ]=="
echo "- Review config files (compare with .bak backups)."
echo "- Manually update code for breaking changes (see Rails upgrade guide: https://edgeguides.rubyonrails.org/upgrading_ruby_on_rails.html)"
echo "- Run your test suite!"
echo "- Check if other gems need updates for Rails 6 compatibility."
echo "- If you use webpacker or JS assets, add 'webpacker' gem and run 'bundle exec rails webpacker:install'."

echo
echo "==[ If you see errors or failing specs, read the error messages and refer to: ]=="
echo "  https://guides.rubyonrails.org/upgrading_ruby_on_rails.html"
echo "  https://github.com/rails/rails/releases/tag/v6.1.7"
echo
echo "==[ Done. Proceed with manual code fixes and tests. ]=="