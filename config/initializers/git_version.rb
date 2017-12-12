APP_VERSION = {
  :major => 0,
  :minor => 9,
  :patch => `git log -n1 --date=short --pretty=format:"%h"`.chomp,
  :hash =>  `git log -n1 --date=short --pretty=format:"%H"`.chomp,
  :last_commit_at => `git log -n1 --date=short --pretty=format:"%ct"`.chomp,
  :deployed_at => Time.now.strftime("%d.%m.%Y"),
  :deployed_at_full => Time.now
}.freeze

APP_VERSION_STRING = [APP_VERSION[:major], APP_VERSION[:minor], APP_VERSION[:patch]].join('.').freeze

