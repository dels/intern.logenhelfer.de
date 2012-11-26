class CreateAppConfigAdapters < ActiveRecord::Migration
  def change
    create_table :app_config_adapters do |t|
      t.string :key
      t.string :value
    end
    add_index :app_config_adapters, :key, :unique => true
  end
end
