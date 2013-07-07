# -*- coding: utf-8 -*-
class AddRoleAnnouncementAdmin < ActiveRecord::Migration
  def up
    
    Role.create!(ordering_number: 0, name: 'AnnouncementAdmin',  display_name: 'Kann Meldungen verwalten', group: true)
  end

  def down
    Role.where(:name => 'AnnouncementAdmin').first.destroy
  end
end
