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
    debug_resp(xml_resp)
    xml_resp
  end

  def self.all_groups(auth_token)
    begin
      xml_resp = RestClient.get("https://www.google.com/m8/feeds/groups/default/full",
                                {params:
                                   {
                                    'Content-Type': 'application/atom+xml',
                                    #'GData-Version': '3.0',
                                    'v': '3',
                                    'access_token': auth_token
                                   },
                                })
    rescue Exception => e
      Rails.logger.fatal("exception while requesting contacts feed: #{e.inspect}")
      return nil
    ensure
      debug_resp(xml_resp)
    end

    xml_resp
  end

  def self.group_by_name(auth_token, search_str)
    xml = Nokogiri::XML(all_groups(auth_token))
    return nil unless xml.at("feed")
    xml.at("feed").search("entry").each do |entry|
      next unless entry
      next if entry.blank?
      # next unless entry.at("id")
      # searching in system groups
      if entry.css("gContact|systemGroup") && entry.css("gContact|systemGroup").first && entry.css("gContact|systemGroup").first['id'].eql?(search_str)
        if entry.css("link") && entry.css("link").first['rel'].eql?("self")
          Rails.logger.fatal("system group contacts found at #{entry.css("link").first['href']}")
          # return entry.css("link").first['href'][0..(entry.css("link").first['href'].length-5)]
          return entry.css("link").first['href']
        end
      end

      # searching in personal groups
      if entry.css("title") && entry.css("title").first && entry.css("title").first.content.eql?(search_str)
        if entry.css("link") && entry.css("link").first['rel'].eql?("self")
          Rails.logger.fatal("group contacts found at #{entry.css("link").first['href']}")
          # return entry.css("link").first['href'][0..(entry.css("link").first['href'].length-5)]
          return entry.css("link").first['href']
        end
      end
    end
    Rails.logger.warn("did not find group \"#{search_str}\"")
    nil
  end
  
  def self.create(auth_token, google_contact)
    RestClient.log = 'stdout' if Rails.env.development?
    system_group_contacts = group_by_name(auth_token, "Contacts")
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
                               },
                               'GData-Version': '3.0',
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
    debug_resp(response)
    res
  end

  def self.contact(auth_token, self_url)
    xml_resp = RestClient.get(self_url,
                              {params:
                                 {                                  
                                   'access_token': auth_token
                                 },
                               'GData-Version': '3.0',
                               #'v': '3',
                               'Content-Type': 'application/atom+xml'
                              })
    xml = Nokogiri::XML(xml_resp)
    debug_resp(xml_resp)
    GoogleContact::parse_xml(xml)
  end
  
  
  def self.merge(auth_token, url, usr_obj)
    change_msgs = []
    gc_res = contact(auth_token, url)
    gc_usr = GoogleContact::parse_user(usr_obj)
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

    return nil unless update(auth_token, url, gc_res)
    change_msgs
  end

  def self.change_message(prev, succ)
    return "old: #{prev}. new: #{succ}"# if prev.is_a?(String) && succ .is_a?(String)
    # TODO deal with email arrays
  end
    
  def self.update(auth_token, self_url, contact)
    #RestClient.log = 'stdout'
    if contact.groups.empty?
      #contact.groups << group_by_name(auth_token, "Contacts")
    end
    if Rails.env.development?
      puts "-"*60
      puts "putting:"
      puts contact.to_atom
    end
    begin
      xml_resp = RestClient.put(self_url, contact.to_atom,
                                params: {
                                  'access_token': auth_token
                                },
                                'GData-Version': '3.0',
                                # 'v': '3',
                                'If-Match': '*',
                                'Content-Type': "application/atom+xml"
                               )
    rescue Exception => e
      Rails.logger.fatal("update failed: #{e.inspect}")
    ensure 
      debug_resp(xml_resp)
    end
    xml_resp
  end


  private

  def self.debug_resp(resp)
    return unless  Rails.env.development?
    puts "-"*60
    puts "received header:\n#{resp.headers}\n" if resp
    puts "received body:\n#{resp.body}\n" if resp
  end
  
end
