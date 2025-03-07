class GdprAcceptanceToUser < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :accepted_gdpr, :boolean, default: false
  end
end
