
def log bool
  print bool ? '.' : 'F'
end

def block msg, &b
  print "#{msg}: "
  result = nil
  begin
    result = yield
  rescue => ex
    puts '*'*80, "#{ex.backtrace.join("\n\t")}: #{ex.message} (#{ex.class})", '*'*80
    raise
  end
  puts " done."
  result
end

ar = nil
ur = nil
er = nil
fr = nil
mr = nil
block 'create roles' do
  log ar = Role.create!(:name => "Admin")
  log ur = Role.create!(:name => "Uploader")
  log er = Role.create!(:name => "Entered Apprentice")
  log fr = Role.create!(:name => "Fellow Craft")
  log mr = Role.create!(:name => "Master Mason")
end

block 'create users' do 
  log u = User.create!(:email => 'deft@deftwork.com', :password => 'keks1024')
  u.roles << ar
  u.roles << ur
  u.roles << mr
  u.roles << fr
  u.roles << er
  u.save!
  log u = User.create!(:email => 'meister@fwze.de', :password => 'keks1024')
  u.roles << mr
  u.roles << fr
  u.roles << er
  u.save!
  log u = User.create!(:email => 'geselle@fwze.de', :password => 'keks1024')
  u.roles << fr
  u.roles << er
  u.save!
  log u = User.create!(:email => 'lehrling@fwze.de', :password => 'keks1024')
  u.roles << er
  u.save!
end

