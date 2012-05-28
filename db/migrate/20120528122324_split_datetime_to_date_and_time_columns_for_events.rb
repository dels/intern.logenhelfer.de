class SplitDatetimeToDateAndTimeColumnsForEvents < ActiveRecord::Migration
  def up
    Event.delete_all

    remove_column :events, :date
    add_column :events, :date, :date, null: false
    add_column :events, :time, :time, null: false
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
