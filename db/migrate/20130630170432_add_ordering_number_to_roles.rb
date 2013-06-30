class AddOrderingNumberToRoles < ActiveRecord::Migration
  def change
    add_column :roles, :ordering_number, :integer
    cur = 1
    %w|WorshipfulMaster DedicatedMaster SeniorWarden JuniorWarden Treasurer InternalSecretary Secretary Speaker MasterOfCeremony SeniorDeacon JuniorDeacon Librarian Archivist PreparingBrother Musician Deakan NetDelegate|.each do |role_name|
      role = Role.where(:name => role_name).first
      role.ordering_number = cur
      cur += 1
      role.save!
    end
  end
end
