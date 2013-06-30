class AddEmailToRoles < ActiveRecord::Migration
  def change
    add_column :roles, :email, :string, :default => nil
  end
end
