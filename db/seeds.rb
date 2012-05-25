# -*- coding: utf-8 -*-

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
sr = nil
ser = nil
jwr = nil
wmr = nil
mocr = nil
block 'create roles' do
  log ar = Role.create!(:name => "Admin", :display_name => "Administrator")
  log ur = Role.create!(:name => "Uploader", :display_name => "Darf hochladen")
  log er = Role.create!(:name => "EnteredApprentice", :display_name => "Lehrling")
  log fr = Role.create!(:name => "FellowCraft", :display_name => "Geselle")
  log mr = Role.create!(:name => "MasterMason", :display_name => "Meister")
  log wmr = Role.create!(:name => "WorshipfulMaster", :display_name => "MvSt")
  log sr = Role.create!(:name => "Secretary", :display_name => "Korrespondierder Schriftführer")
  log ser = Role.create!(:name => "SeniorWarden", :display_name => "Erster Aufseher")
  log jwr = Role.create!(:name => "JuniorWarden", :display_name => "Zweiter Aufseher")
  log mocr = Role.create!(:name => "MemberOfCouncil", :display_name => "Mitglieder des Beamtenrates")
  
end

block 'create users' do 
  log u = User.create!(
                       :matriculation_number => 891,
                       :email => 'deft@deftwork.com', 
                       :password => 'keks4096', 
                       :firstname => "El", 
                       :lastname => "Chefe",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )
  u.roles << ar
  u.roles << ur
  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 4.years)
  u.user_roles << UserRole.create!(:role => fr, :user => u, :role_added_at => Date.today - 2.years)
  u.user_roles << UserRole.create!(:role => mr, :user => u, :role_added_at => Date.today - 1.years)
  u.roles << wmr
  u.roles << mocr
  u.save!
  log u = User.create!(
                       :matriculation_number => 892,
                       :email => 'uploader@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "Hoch", 
                       :lastname => "Lader",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )

  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 4.years)
  u.user_roles << UserRole.create!(:role => fr, :user => u, :role_added_at => Date.today - 2.year)
  u.user_roles << UserRole.create!(:role => mr, :user => u, :role_added_at => Date.today - 1.year)
  u.roles << ur
  u.save!
  log u = User.create!(
                       :matriculation_number => 892,
                       :email => 'sekretaer@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "Korrespondierender", 
                       :lastname => "Schriftfuehrer",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )
  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 3.years)
  u.user_roles << UserRole.create!(:role => fr, :user => u, :role_added_at => Date.today - 2.year)
  u.user_roles << UserRole.create!(:role => mr, :user => u, :role_added_at => Date.today - 1.year)
  u.roles << sr
  u.save!
  log u = User.create!(
                       :matriculation_number => 893,
                       :email => 'meister@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "master", 
                       :lastname => "mason",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )
  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 4.years)
  u.user_roles << UserRole.create!(:role => fr, :user => u, :role_added_at => Date.today - 2.year)
  u.user_roles << UserRole.create!(:role => mr, :user => u, :role_added_at => Date.today - 1.year)
  u.save!
  log u = User.create!(
                       :matriculation_number => 894,
                       :email => 'geselle@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "fellow", 
                       :lastname => "craft",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )
  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 1.years)
  u.user_roles << UserRole.create!(:role => fr, :user => u, :role_added_at => Date.today - 2.year)
  u.save!
  log u = User.create!(
                       :matriculation_number => 895,
                       :email => 'lehrling@fwze.de', 
                       :password => 'keks1024', 
                       :firstname => "entered", 
                       :lastname => "apprentice",
                       :job_title => "freemason",
                       :date_of_birth => Date.today - 40.years,
                       )
  u.user_roles << UserRole.create!(:role => er, :user => u, :role_added_at => Date.today - 1.years)
  u.save!
end

rite_cat = nil
lit_cat = nil
paint_cat = nil
dir_cat = nil
misc_cat = nil
council_cat = nil
block 'create categories' do
  log rite_cat = Category.create!(
                                  :name =>"Rituale",
                                  :roles => [er, fr , mr]
                                  )
  log lit_cat = Category.create!(
                                 :name =>"Literatur",
                                 :roles => [er, fr , mr]
                                 )
  log misc_cat = Category.create!(
                                 :name =>"Allgemeines",
                                 :roles => [er, fr , mr]
                                 )
  log paint_cat = Category.create!(
                                 :name =>"Zeichnungen",
                                 :roles => [er, fr , mr]
                                 )
  log dir_cat = Category.create!(
                                 :name =>"Verzeichnisse",
                                 :roles => [er, fr , mr]
                                 )
  log council_cat = Category.create!(
                                 :name =>"Beamtenrat",
                                 :roles => [mocr]
                                 )
end

block 'create directories' do
  # Rituale
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
  # Literatur
  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Allgemeines",
                        :roles => [er, fr , mr]
                        )

  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Royal York",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Fessler",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Handbücher",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => lit_cat, 
                        :name => "Interne Dokumente",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => lit_cat, 
                        :name => "eBooks",
                        :roles => [er, fr , mr]
                        )
  # Sonstiges
  log Directory.create!(
                        :category => misc_cat, 
                        :name => "Presse",
                        :roles => [er, fr , mr]
                        )
  # Zeichnungen
  log Directory.create!(
                        :category => paint_cat, 
                        :name => "Zeichnungen",
                        :roles => [er, fr , mr]
                        )
  # Verzeichnisse
  log Directory.create!(
                        :category => dir_cat, 
                        :name => "Intern",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => dir_cat, 
                        :name => "Telefonliste",
                        :roles => [er, fr , mr]
                        )
  log Directory.create!(
                        :category => dir_cat, 
                        :name => "Witwenliste",
                        :roles => [er, fr , mr]
                        )
  # Beamtenrat
  log Directory.create!(
                        :category => council_cat, 
                        :name => "Protokolle",
                        :roles => [mocr]
                        )
  log Directory.create!(
                        :category => council_cat, 
                        :name => "Vorstand",
                        :roles => [mocr]
                        )
  log Directory.create!(
                        :category => council_cat, 
                        :name => "Posteingang",
                        :roles => [mocr]
                        )
  log Directory.create!(
                        :category => council_cat, 
                        :name => "Gästeliste",
                        :roles => [mocr]
                        )
end
