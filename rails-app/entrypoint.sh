#!/bin/bash

if [ "__$RAILS_ENV" = "__" ] ; then
   echo "rails env not found";
   exit 1;
fi

if [ "__$RAILS_USER" = "__" ] ; then
   echo "rails user not found";
   exit 1;
fi

if [ "__$RAILS_PATH" = "__" ] ; then
   echo "rails path not found";
   exit 1;
fi

echo "using $RAILS_ENV as environment. will chmod to $RAILS_USER:$RAILS_GROUP"
echo "installing gems" &&
RAILS_ENV=$RAILS_ENV bundle install &&
if [ "__$RAILS_ENV" = "__development" ] ; then
  echo "setting up database in development mode..." &&
  RAILS_ENV=$RAILS_ENV rails db:setup
fi
echo "migrating..." &&
RAILS_ENV=$RAILS_ENV rails db:migrate &&
echo "compiling assets" &&
RAILS_ENV=$RAILS_ENV rails assets:clean assets:precompile &&


# chown -R $RAILS_USER:$RAILS_GROUP $RAILS_PATH ;
echo "starting resque" &&
RAILS_ENV=$RAILS_ENV rails resque:start &&
echo "starting puma..." &&
RAILS_ENV=$RAILS_ENV bundle exec puma