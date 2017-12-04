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
    puts '*'*80, "#{ex.message} (#{ex.class}): #{ex.backtrace.join("\n\t")}", '*'*80
    raise
  end
  puts " done."
  result
end

def rndm_birthdate
  Date.today - Random.rand(18...80).years - Random.rand(0...365).days
end

ar = nil
ur = nil
er = nil
fr = nil
mr = nil
sr = nil
sd = nil
ser = nil
jwr = nil
wm = nil
mocr = nil

Role.where(:name => ['WorshipfulMaster', 'InternalSecretary', 'Secretary', 'SeniorWarden', 'JuniorWarden', 'HonoryMember', 'Deakan', 'Speaker', 'Musician', 'MasterOfCeremony', 'PreparingBrother', 'PastMaster', 'DedicatedMaster', 'Treasurer', 'JuniorDeacon', 'SeniorDeacon', 'NetDelegate'])

block 'create roles' do
  log ar    = Role.create!(ordering_number: 0, name: 'Admin',            display_name: 'Administrator',                group: true)
  log ur    = Role.create!(ordering_number: 0,name: 'FileAdmin',         display_name: 'Kann Dateien verwalten',       group: true)
  log er    = Role.create!(ordering_number: 0,name: 'EnteredApprentice', display_name: 'Lehrling',                     group: true)
  log fr    = Role.create!(ordering_number: 0,name: 'FellowCraft',       display_name: 'Geselle',                      group: true)
  log mr    = Role.create!(ordering_number: 0,name: 'MasterMason',       display_name: 'Meister',                      group: true)
  log wm    = Role.create!(ordering_number: 1,name: 'WorshipfulMaster',  display_name: 'MvSt', administrational_role: false)
  log         Role.create!(ordering_number: 2, name: 'DedicatedMaster',  display_name: 'zug. Meister',                 group: true, administrational_role: false)
  log ser   = Role.create!(ordering_number: 3,name: 'SeniorWarden',      display_name: '1. Aufseher', administrational_role: false)
  log jwr   = Role.create!(ordering_number: 4,name: 'JuniorWarden',      display_name: '2. Aufseher', administrational_role: false)
  log         Role.create!(ordering_number: 5, name: 'Treasurer',        display_name: 'Schatzmeister', administrational_role: false)
  log sp    = Role.create!(ordering_number: 6,name: 'InternalSecretary', display_name: 'Protokolliernder Schriftführer', administrational_role: false)
  log sr    = Role.create!(ordering_number: 7,name: 'Secretary',         display_name: 'Korrespondierender Schriftführer', administrational_role: false)
  log         Role.create!(ordering_number: 8, name: 'Speaker',          display_name: 'Redner', administrational_role: false)
  log         Role.create!(ordering_number: 9, name: 'MasterOfCeremony', display_name: 'Zeremonienmeister', administrational_role: false)
  log sd    = Role.create!(ordering_number: 10, name: 'SeniorDeacon',    display_name: '1. Schaffer', administrational_role: false)
  log         Role.create!(ordering_number: 11, name: 'JuniorDeacon',    display_name: '2. Schaffer', administrational_role: false)
  log         Role.create!(ordering_number: 12, name: 'PreparingBrother',display_name: 'Vorbereitender Bruder', administrational_role: false)
  log         Role.create!(ordering_number: 13, name: 'Librarian',       display_name: 'Bibliothekar', administrational_role: false)
  log         Role.create!(ordering_number: 14, name: 'Archivist',       display_name: 'Archivar', administrational_role: false)
  log         Role.create!(ordering_number: 15, name: 'PreparingBrother',display_name: 'Vorbereitender Bruder', administrational_role: false)
  log         Role.create!(ordering_number: 16, name: 'Musician',        display_name: 'Musikmeister',  administrational_role: false)
  log         Role.create!(ordering_number: 17, name: 'Deakan',          display_name: 'Wachhabender',  administrational_role: false)
  log         Role.create!(ordering_number: 18, name: 'NetDelegate',     display_name: 'Internet-Beauftragter',        group: true, administrational_role: false)

  log mocr  = Role.create!(ordering_number: 0, name: 'MemberOfCouncil',   display_name: 'Mitglieder des Beamtenrates',  group: true)
  log         Role.create!(ordering_number: 0, name: 'HonoryMember',      display_name: 'Ehrenmitglied',                group: true, administrational_role: false)
  log         Role.create!(ordering_number: 0, name: 'PastMaster',        display_name: 'Altstuhlmeister',              group: true, administrational_role: false)
  log         Role.create!(ordering_number: 0, name: 'WorkingPlanAdmin',  display_name: 'Kann Arbeitsplan bearbeiten',  group: true)
  log         Role.create!(ordering_number: 0, name: 'UserAdmin',         display_name: 'Kann Benutzer verwalten',      group: true)
  log         Role.create!(ordering_number: 0, name: 'ApplicationAdmin',  display_name: 'Kann Anwendung konfigurieren', group: true)
end



block 'create academic titles' do
  log AcademicTitle.create!(
        title: "Doktor",
        short: "Dr."
      )
    log AcademicTitle.create!(
        title: "Diplom-Informatiker.",
        short: "Dipl.-Inf."
      )
  log AcademicTitle.create!(
        title: "Diplom Ingineur.",
        short: "Dipl. Ing."
      )
  log AcademicTitle.create!(
        title: "Professor",
        short: "Prof"
      )

end


block 'create users' do
  log u = User.create!(
                       matriculation_number: 890,
                       email: 'admin@logenhelfer.de',
                       password: 'keks4096',
                       firstname: "El",
                       lastname: "Chefe",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = (Date.today - 2.year).to_s
  u.fellow_craft_since = (Date.today - 1.year).to_s
  u.master_mason_since = (Date.today - 1.year).to_s
  u.roles << ur  
  u.roles << ar
  u.save!
  log u = User.create!(
                       matriculation_number: 891,
                       email: 'uploader@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "Hoch",
                       lastname: "Lader",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = (Date.today - 3.years)
  u.fellow_craft_since = Date.today - 2.years
  u.master_mason_since = Date.today - 1.years
  u.roles << ur
  u.save!

  log u = User.create!(
                       matriculation_number: 892,
                       email: 'sekretaer@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "Korrespondierender",
                       lastname: "Schriftfuehrer",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = Date.today - 5.years
  u.fellow_craft_since = Date.today - 3.years
  u.master_mason_since = Date.today - 1.years
  u.roles << sr
  u.save!
  log u = User.create!(
                       matriculation_number: 896,
                       email: 'schaffer@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "Erster",
                       lastname: "Schaffer",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = Date.today - 5.years
  u.fellow_craft_since = Date.today - 3.years
  u.master_mason_since = Date.today - 1.years
  u.roles << sd
  u.save!
  log u = User.create!(
                       matriculation_number: 924,
                       email: 'mvst@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "Meister",
                       lastname: "vom Stuhl",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = Date.today - 3.years
  u.fellow_craft_since = Date.today - 2.years
  u.master_mason_since = Date.today - 1.years
  u.roles << wm
  u.save!
  log u = User.create!(
                       matriculation_number: 893,
                       email: 'meister@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "master",
                       lastname: "mason",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )

  u.entered_apprentice_since = Date.today - 3.years
  u.fellow_craft_since = Date.today - 2.years
  u.master_mason_since = Date.today - 1.years
  u.save!
  log u = User.create!(
                       matriculation_number: 894,
                       email: 'geselle@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "fellow",
                       lastname: "craft",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )

  u.entered_apprentice_since = Date.today - 2.year
  u.fellow_craft_since = Date.today - 1.year
  u.save!
  log u = User.create!(
                       matriculation_number: 895,
                       email: 'lehrling@logenhelfer.de',
                       password: 'jakin1024',
                       firstname: "entered",
                       lastname: "apprentice",
                       job_title: "freemason",
                       date_of_birth: rndm_birthdate
                       )
  u.entered_apprentice_since = Date.today - 2.year
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
                                  name:"Rituale",
                                  roles: [er, fr , mr]
                                  )
  log lit_cat = Category.create!(
                                 name:"Literatur",
                                 roles: [er, fr , mr]
                                 )
  log misc_cat = Category.create!(
                                 name:"Allgemeines",
                                 roles: [er, fr , mr]
                                 )
  log paint_cat = Category.create!(
                                 name:"Zeichnungen",
                                 roles: [er, fr , mr]
                                 )
  log dir_cat = Category.create!(
                                 name:"Verzeichnisse",
                                 roles: [er, fr , mr]
                                 )
  log council_cat = Category.create!(
                                 name:"Beamtenrat",
                                 roles: [mocr]
                                 )
end

entered_apprentice_dir = nil
fellow_craft_dir = nil
master_mason_dir = nil

block 'create directories' do
  # Rituale
  log entered_apprentice_dir = Directory.create!(
                                                  category: rite_cat,
                                                  name: "Lehrling",
                                                  roles: [er, fr , mr]
                                                  )
  log fellow_craft_dir = Directory.create!(
                                          category: rite_cat,
                                          name: "Geselle",
                                          roles: [fr , mr]
                                          )
  log master_mason_dir = Directory.create!(
                                           category: rite_cat,
                                           name: "Meister",
                                           roles: [mr]
                                           )
  # Literatur
  log Directory.create!(
                        category: lit_cat,
                        name: "Allgemeines",
                        roles: [er, fr , mr]
                        )

  log Directory.create!(
                        category: lit_cat,
                        name: "Royal York",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: lit_cat,
                        name: "Fessler",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: lit_cat,
                        name: "Handbücher",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: lit_cat,
                        name: "Interne Dokumente",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: lit_cat,
                        name: "eBooks",
                        roles: [er, fr , mr]
                        )
  # Sonstiges
  log Directory.create!(
                        category: misc_cat,
                        name: "Presse",
                        roles: [er, fr , mr]
                        )
  # Zeichnungen
  log Directory.create!(
                        category: paint_cat,
                        name: "Zeichnungen",
                        roles: [er, fr , mr]
                        )
  # Verzeichnisse
  log Directory.create!(
                        category: dir_cat,
                        name: "Intern",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: dir_cat,
                        name: "Telefonliste",
                        roles: [er, fr , mr]
                        )
  log Directory.create!(
                        category: dir_cat,
                        name: "Witwenliste",
                        roles: [er, fr , mr]
                        )
  # Beamtenrat
  log Directory.create!(
                        category: council_cat,
                        name: "Protokolle",
                        roles: [mocr]
                        )
  log Directory.create!(
                        category: council_cat,
                        name: "Vorstand",
                        roles: [mocr]
                        )
  log Directory.create!(
                        category: council_cat,
                        name: "Posteingang",
                        roles: [mocr]
                        )
  log Directory.create!(
                        category: council_cat,
                        name: "Gästeliste",
                        roles: [mocr]
                        )
end

block 'create files' do

  log AttachedFile.create!(
                           filename: "MasterMasonRite.pdf", 
                           content: File.open(File.join(Rails.root, "/app/assets/seed/MasterMasonRite.pdf")),
                           content_type: "application/pdf",
                           directory_id: master_mason_dir.id,
                           roles: [mr]
                           )
  
  log AttachedFile.create!(
                           filename: "FellowCraftRite.pdf", 
                           content: File.open(File.join(Rails.root, "/app/assets/seed/FellowCraftRite.pdf")),
                           content_type: "application/pdf",
                           directory_id: fellow_craft_dir.id,
                           roles: [fr , mr]
                           )
  
  log AttachedFile.create!(
                           filename: "EnteredApprenticeRite.pdf", 
                           content: File.open(File.join(Rails.root, "/app/assets/seed/EnteredApprenticeRite.pdf")),
                           content_type: "application/pdf",
                           directory_id: entered_apprentice_dir.id,
                           roles: [er, fr , mr]
                           )
  
  log AttachedFile.create!(
                           filename: "InitiationRite.pdf", 
                           content: File.open(File.join(Rails.root, "/app/assets/seed/InitiationRite.pdf")),
                           content_type: "application/pdf",
                           directory_id: entered_apprentice_dir.id,
                           roles: [er, fr , mr]
                           )
  
end

hh = nil
hb = nil
h = nil
block 'create districts' do
  log hh = District.create!(
        name: "Hamburg"
      )
  log hb = District.create!(
        name: "Bremen"
      )
    log h = District.create!(
        name: "Hannover"
      )
end

ss = nil
baer = nil
block 'create lodges' do
  log ss = Lodge.create!(
        district_id: hb.id,
        name: "Silberner Schlüssel"
      )
    log baer = Lodge.create!(
        district_id: h.id,
        name: "Zum schwarzen Bär"
      )
end

block 'create officers' do
  log Officer.create!(
        firstname: "Mark A.",
        lastname: "Waldmann",
        lodge_id: baer.id,
        role_email: "Sekretaer@zum-schwarzen-baer.de",
        role_id: sr.id
      )
  log Officer.create!(
        firstname: "Roland",
        lastname: "Kerstein",
        lodge_id: ss.id,
        role_email: "mvst@silberner-schluessel.de",
        role_id: wm.id
      )
end


block 'configuring app' do
  {
    :default_from_email => "web@logenhelfer.de",
    :user_change_notification_email => "report@elsbroek.com",
    :default_event_location => "Bremen",
    :technical_contact_email => "report@elsbroek.com",
  }.each_pair do |key,val|
    log AppConfig[key] = val
  end

end
