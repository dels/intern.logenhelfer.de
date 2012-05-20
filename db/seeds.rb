
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
wmr = nil
mocr = nil
block 'create roles' do
  log ar = Role.create!(:name => "Admin", :display_name => "Administrator")
  log ur = Role.create!(:name => "Uploader", :display_name => "Darf hochladen")
  log er = Role.create!(:name => "EnteredApprentice", :display_name => "Lehrling")
  log fr = Role.create!(:name => "FellowCraft", :display_name => "Geselle")
  log mr = Role.create!(:name => "MasterMason", :display_name => "Meister")
  log wmr = Role.create!(:name => "WorshipfulMaster", :display_name => "MvSt")
  log mocr = Role.create!(:name => "MemberOfCouncil", :display_name => "Beamtenratsmitglied")
  
end

block 'create users' do 
  log u = User.create!(
                       :email => 'deft@deftwork.com', 
                       :password => 'keks1024', 
                       :firstname => "El", 
                       :lastname => "Chefe",
                       :date_of_birth => Date.today - 40.years,
                       :included_at => Date.today - 4.years
                       )
  u.roles << ar
  u.roles << ur
  u.roles << mr
  u.roles << fr
  u.roles << er
  u.roles << wmr
  u.roles << mocr
  u.save!
  log u = User.create!(
                       :email => 'meister@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "master", 
                       :lastname => "mason",
                       :date_of_birth => Date.today - 40.years,
                       :included_at => Date.today - 4.years
                       )
  u.roles << mr
  u.roles << fr
  u.roles << er
  u.save!
  log u = User.create!(:email => 'geselle@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "fellow", 
                       :lastname => "craft",
                       :date_of_birth => Date.today - 40.years,
                       :included_at => Date.today - 2.years
                       )
  u.roles << fr
  u.roles << er
  u.save!
  log u = User.create!(:email => 'lehrling@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "entered", 
                       :lastname => "apprentice",
                       :date_of_birth => Date.today - 40.years,
                       :included_at => Date.today - 1.years
                       )
  u.roles << er
  u.save!
end

rite_cat = nil
lit_cat = nil
block 'create categories' do
  log rite_cat = Category.create!(
                                  :name =>"Rituale",
                                  :roles => [er, fr , mr]
                                  )
  log lit_cat = Category.create!(
                                 :name =>"Literatur",
                                 :roles => [er, fr , mr]
                                 )
end

block 'create directories' do
  log Directory.create!(
                        :category => rite_cat, 
                        :name => "Lehrling",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => rite_cat, 
                        :name => "Geselle",
                        :roles => [fr , mr]
                        )
  log Directory.create!(
                        :category => rite_cat, 
                        :name => "Meister",
                        :roles => [mr]
                        )

  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Allgemeines",
                        :roles => [er, fr , mr]
                        )

  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Schroeder",
                        :roles => [er, fr , mr]
                        )

  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Fessler",
                        :roles => [er, fr , mr]
                        )
end



