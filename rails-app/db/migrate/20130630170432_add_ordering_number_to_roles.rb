class AddOrderingNumberToRoles < ActiveRecord::Migration
  def up
    add_column :roles, :ordering_number, :integer
    cur = 1
    %w|WorshipfulMaster DedicatedMaster SeniorWarden JuniorWarden Treasurer InternalSecretary Secretary Speaker MasterOfCeremony SeniorDeacon JuniorDeacon Librarian Archivist PreparingBrother Musician Deakan NetDelegate|.each do |role_name|
      next unless role_name
      role = Role.where(:name => role_name).first
      next unless role
      role.ordering_number = cur
      cur = cur + 1
      role.save!
    end
  end
  
  def down
    remove_column :roles, :ordering_number
  end

end
