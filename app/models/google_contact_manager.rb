class GoogleContactManager

  def self.all_contacts(auth_token)
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/contacts/default/full",
                                {params:
                                   {
                                     'max-results': 1000000,
                                    'GData-Version': '3.0',
                                    'Content-Type': 'application/atom+xml',
                                    'access_token': auth_token
                                   }
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    end
    puts "recevied all contacts:" if Rails.env.development?
    puts xml_resp if Rails.env.development?
    xml_resp
  end

  def self.all_groups(auth_token)
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/groups/default/full",
                                {params:
                                   {
                                     'max-results': 1000000,
                                    'Content-Type': 'application/atom+xml',
                                    'v': '3',
                                    'access_token': auth_token
                                   }
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    end
    xml_resp
  end

  def self.my_contacts_group_link(auth_token)
    xml = Nokogiri::XML(all_groups(auth_token))
    return nil unless xml.at("feed")
    xml.at("feed").search("entry").each do |entry|
      next unless entry
      next if entry.blank?
      next unless entry.at("id")
      if entry.css("gContact|systemGroup") && entry.css("gContact|systemGroup").first['id'].eql?("Contacts")
        if entry.css("link") && entry.css("link").first['rel'].eql?("self")
          Rails.logger.fatal("system group contacts found at #{entry.css("link").first['href']}")
          return entry.css("link").first['href']
        end
      end
    end
    nil
  end
  
  def self.create(auth_token, google_contact)
    RestClient.log = 'stdout' if Rails.env.development?
    system_group_contacts = my_contacts_group_link(auth_token)
    raise ("could not find system group 'Contacts'") unless system_group_contacts
    unless google_contact.groups.find_index(system_group_contacts)
      google_contact.system_groups << system_group_contacts
    end
    atom = google_contact.to_atom
    url = "https://www.google.com/m8/feeds/contacts/default/full"
    puts "posting to #{url} \n#{atom}" if Rails.env.development?
    response = RestClient.post(url, atom,
                               params: {
                                 #'Authorization': "Bearer #{auth_token}"
                                 'access_token': auth_token,
                                        # 'v': '3'
                               },
                               'GData-Version': '3.0',
                               #
                               'Content-Type': 'application/atom+xml'
                              )

    if response.code == 201
      res = "Neuen Kontakt erstellt."
      Rails.logger.debug("resp body: \n#{response.body}")
    else
      # FIXME change spaeter to spater with umlaut
      res = "Kontakt konnte nicht erstellt werden. Bitte versuche es spaeter erneut."
      Rails.logger.fatal("response code was #{response.code}")
    end
    res
  end

  def self.contact(auth_token, self_url)
    xml_resp = RestClient.get(self_url,
                              {params:
                                 {                                  
                                   'access_token': auth_token
                                 },
                               'GData-Version': '3.0',
                               'Content-Type': 'application/atom+xml'
                              })
    xml = Nokogiri::XML(xml_resp)
    puts "received header: #{xml_resp.headers}" if Rails.env.development?
    puts "received: #{xml}" if Rails.env.development?
    
    GoogleContact::parse_xml(xml)
  end
    
  
  def self.merge(auth_token, url, gc_usr)
    change_msgs = []
    gc_res = contact(auth_token, url)
    gc_usr = GoogleContact::parse_user(@user)
    # check phone numbers
    unless gc_res.work_phone.eql?(gc_usr.work_phone)
      change_msgs << "changed work phone. #{change_message(gc_res.work_phone, gc_usr.work_phone)}"
      gc_res.work_phone = gc_usr.work_phone
    end
    unless gc_res.home_phone.eql?(gc_usr.home_phone)
      change_msgs << "changed home phone. #{change_message(gc_res.home_phone, gc_usr.home_phone)}"
      gc_res.home_phone = gc_usr.home_phone
    end
    unless gc_res.mobile_phone.eql?(gc_usr.mobile_phone)
      change_msgs << "changed mobile phone. #{change_message(gc_res.mobile_phone, gc_usr.mobile_phone)}"
      gc_res.mobile_phone = gc_usr.mobile_phone
    end
    # check emails
    unless gc_res.home_email.eql?(gc_usr.home_email)
      change_msgs << "changed home email addr. #{change_message(gc_res.home_email, gc_usr.home_email)}"
      gc_res.home_email = gc_usr.home_email
    end
    unless gc_res.work_email.eql?(gc_usr.work_email)
      change_msgs << "changed work email addr. #{change_message(gc_res.work_email, gc_usr.work_email)}"
      gc_res.work_email = gc_usr.work_email
    end
    # check birthdate
    unless gc_res.date_of_birth.to_s.eql?(gc_usr.date_of_birth.to_s)
      change_msgs << "changed date of birth. #{change_message(gc_res.date_of_birth, gc_usr.date_of_birth)}"
      gc_res.date_of_birth = gc_usr.date_of_birth
    end
    # FIXME just adding the addresses without comparison
    gc_res.home_address[:street] = gc_usr.home_address[:street]
    gc_res.home_address[:postcode] = gc_usr.home_address[:postcode]
    gc_res.home_address[:city] = gc_usr.home_address[:city]
    gc_res.work_address[:street] = gc_usr.work_address[:street]
    gc_res.work_address[:postcode] = gc_usr.work_address[:postcode]
    gc_res.work_address[:city] = gc_usr.work_address[:city]

    gc_usr.other_address.each do |addr|
      gc_res.other_address << addr
    end

    # copying groups
    gc_usr.groups.each do |grp|
      gc_res.groups << grp
    end

    #RestClient.log = 'stdout'
    xml_resp = RestClient.put(params[:self_url], gc_res.to_atom,
                              params: {
                                  'access_token': current_google_user.oauth_token
                              },
                              'GData-Version': '3.0',
                              'If-Match': '*',
                              'Content-Type': "application/atom+xml",
                             )
    puts "received header:\n#{xml_resp.headers}" if Rails.env.development?
    puts "sent:\n#{gc_res.to_atom}" if Rails.env.development?
    
    change_msgs
  end

  
end
