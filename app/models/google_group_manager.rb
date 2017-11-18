# coding: utf-8
class GoogleGroupManager

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
    end

    xml_resp
  end
  
  def self.contacts_group_id(auth_token)
    xml = Nokogiri::XML(all_groups(auth_token))
    return nil unless xml.at("feed")
    xml.at("feed").search("entry").each do |entry|
      next unless entry
      next if entry.blank?
      if entry.css("title").first && entry.css("title").first.content.eql?("System Group: My Contacts")
        return entry.css("id").first.content
      end
    end
    nil
  end

  def self.lodge_group_id(auth_token)
    xml = Nokogiri::XML(all_groups(auth_token))
    return nil unless xml.at("feed")
    xml.at("feed").search("entry").each do |entry|
      next unless entry
      next if entry.blank?
      if entry.css("title").first && entry.css("title").first.content.eql?(AppConfig[:lodge_short])
        return entry.css("id").first.content
      end
    end
    # if lodge group could not been found, we have to create it
    url = "https://www.google.com/m8/feeds/groups/default/full"
    group_atom = ""
    group_atom << "<atom:entry xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:gd=\"http://schemas.google.com/g/2005\">\n"
    group_atom << "  <atom:category scheme=\"http://schemas.google.com/g/2005#kind\"\n"
    group_atom << "    term=\"http://schemas.google.com/contact/2008#group\"/>\n"
    group_atom << "  <atom:title type=\"text\">#{AppConfig[:lodge_short]}</atom:title>\n"
    group_atom << "  <gd:extendedProperty name=\"#{AppConfig[:lodge]}\">\n"
    group_atom << "    <info>Kontakte der Loge #{AppConfig[:lodge]}</info>\n"
    group_atom << "  </gd:extendedProperty>\n"
    group_atom << "</atom:entry>\n"
    
    xml_resp = RestClient.post(url, group_atom,
                               params: {
                                 'access_token': auth_token,
                               },
                               'GData-Version': '3.0',
                               'Content-Type': 'application/atom+xml'
                              )
    if xml_resp.code == 201
      res = "Neue Gruppe erstellt: #{AppConfig[:lodge_short]}"
    else
      res = "Gruppe konnte nicht erstellt werden. Bitte versuche es später erneut."
      Rails.logger.fatal("response code was #{xml_resp.code}")
    end
    Nokogiri::XML(xml_resp.body).at("entry").css("id").first.content
  end
  
  def self.group_by_name(auth_token, search_str)
    xml = Nokogiri::XML(all_groups(auth_token))
    return nil unless xml.at("feed")
    xml.at("feed").search("entry").each do |entry|
      if entry.css("title").first && entry.css("title").first.content.eql?(search_str)
        return entry.css("id").first.content
      end
    end
    Rails.logger.warn("did not find group \"#{search_str}\"")
    nil
  end

end
