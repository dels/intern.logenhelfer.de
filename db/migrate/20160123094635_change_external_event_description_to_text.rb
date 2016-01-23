class ChangeExternalEventDescriptionToText < ActiveRecord::Migration
  def up
    change_column :external_events, :description, :text
  end

  def down
    change_column :external_events, :description, :string
  end
end
