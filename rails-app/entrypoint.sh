#!/bin/bash

npm install yarn -g &&

/root/.rbenv/shims/gem install bundler:1.16.6 &&

echo "bundle install" &&
RAILS_ENV=$RAILS_ENV /root/.rbenv/shims/bundle install &&
# echo "bundle update" &&
# /root/.rbenv/shims/bundle update &&

if [ "X$RAILS_ENV" = "Xdevelopment" ] ; then
  echo "setting up database in development mode..." &&
  RAILS_ENV=$RAILS_ENV /root/.rbenv/shims/bundle exec rails db:setup
fi

echo "migrating... " &&
RAILS_ENV=$RAILS_ENV /root/.rbenv/shims/bundle exec rails db:migrate &&
#echo "compiling assets" &&
#RAILS_ENV=$RAILS_ENV /root/.rbenv/shims/bundle exec rails assets:clean assets:precompile &&

# chown -R $RAILS_USER:$RAILS_GROUP $RAILS_PATH ;
echo "starting resque" &&
RAILS_ENV=$RAILS_ENV /root/.rbenv/shims/bundle exec rails resque:start &&
echo "starting puma..." &&
RAILS_ENV=$RAILS_ENV RAILS_PATH=$RAILS_PATH /root/.rbenv/shims/bundle exec bundle exec puma
