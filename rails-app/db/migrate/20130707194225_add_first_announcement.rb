# -*- coding: utf-8 -*-
class AddFirstAnnouncement < ActiveRecord::Migration
  def up
    begin 
      Announcement.create!(:title => 'Nachrichten-System eingeführt', :message_body => 'Wir haben nun ein Nachrichten-System, welches uns erlaubt alle Neuigkeiten, Ankündigunen und Entscheidungen zentral mitzuteilen und zu dokumentieren.\n\nZudem kann sich jeder Benutzer die Meldungen abbonieren. Das bedeutet, sobald eine neue Meldung erstellt worden ist bekommt jeder Abonnent eine E-Mail. So verpasst niemand eine Meldung, der es nicht will.\n\nHerzliche brdrl. Grüße\n', :created_by => Role.where(:name => 'Admin').first.users.first)
    rescue
      nil
    end
  end

  def down
  end
end
