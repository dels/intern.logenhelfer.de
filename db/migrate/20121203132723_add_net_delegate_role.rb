class AddNetDelegateRole < ActiveRecord::Migration
  def up
    Role.where(name: 'NetDelegate', display_name: 'Internet-Beauftragter').first_or_create
  end

  def down
    Role.where(name: 'NetDelegate', display_name: 'Internet-Beauftragter').first.destroy
  end
end
