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
    ensure
      debug_resp(xml_resp)
    end

    xml_resp
  end

  def self.find_or_create(auth_token, name, ext_info, desc)
    grp = group_by_name(auth_token, name)
    unless grp
      Rails.logger.warn("group #{name} doesn't exist. creating...")
      return nil unless (grp = create(auth_token, name, ext_info, desc))
      Rails.logger.warn("group #{name} created")
    end
    grp
  end

  def self.create(auth_token, name, ext_info, desc)
    url = "https://www.google.com/m8/feeds/groups/default/full"
    group_atom = ""
    group_atom << "<atom:entry xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:gd=\"http://schemas.google.com/g/2005\">\n"
    group_atom << "  <atom:category scheme=\"http://schemas.google.com/g/2005#kind\"\n"
    group_atom << "    term=\"http://schemas.google.com/contact/2008#group\"/>\n"
    group_atom << "  <atom:title type=\"text\">#{name}</atom:title>\n"
    group_atom << "  <gd:extendedProperty name=\"#{ext_info}\">\n" if ext_info
    group_atom << "    <info>#{desc}</info>\n" if desc
    group_atom << "  </gd:extendedProperty>\n"
    group_atom << "</atom:entry>\n"
    
    puts "posting to #{url} \n#{group_atom}" if Rails.env.development?
    xml_resp = RestClient.post(url, group_atom,
                               params: {
                                 'access_token': auth_token,
                               },
                               'GData-Version': '3.0',
                               'Content-Type': 'application/atom+xml'
                              )
    if xml_resp.code == 201
      res = "Neue Gruppe erstellt: #{name}"
      Rails.logger.debug("resp body: \n#{xml_resp.body}")
    else
      res = "Gruppe konnte nicht erstellt werden. Bitte versuche es später erneut."
      Rails.logger.fatal("response code was #{xml_resp.code}")
    end
    debug_resp(xml_resp)
    res
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
  
  def self.group_by_name(auth_token, search_str)
    Rails.logger.debug("SEARCH GROUP: #{search_str}")
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

  private
  
  def self.debug_resp(resp)
    return unless  Rails.env.development?
    puts "-"*60
    puts "received header:\n#{resp.headers}\n" if resp
    puts "received body:\n#{resp.body}\n" if resp
  end
end
