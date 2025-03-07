class ChangeAppConfigValuesToText < ActiveRecord::Migration
  def up
    change_column :app_config_adapters, :value, :text
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
