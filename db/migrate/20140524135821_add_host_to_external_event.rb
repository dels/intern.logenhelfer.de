class AddHostToExternalEvent < ActiveRecord::Migration
  def change
    add_column :external_events, :host, :string
  end
end
