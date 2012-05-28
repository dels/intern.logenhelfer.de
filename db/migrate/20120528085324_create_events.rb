class CreateEvents < ActiveRecord::Migration
  def self.up
    create_table :events do |t|
      t.datetime  :date
      t.string    :title
      t.text      :public_description
      t.text      :private_description
      t.boolean   :whole_day
      t.integer   :duration
      t.integer   :created_by_id
      t.integer   :updated_by_id
      t.boolean   :deleted,             default: :false
      t.timestamps
    end

    add_index :events, :date
    add_index :events, :created_by_id
    add_index :events, :updated_by_id
  end

  def self.down
    drop_table :events
  end
end
