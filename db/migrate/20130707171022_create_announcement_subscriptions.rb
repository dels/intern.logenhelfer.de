class CreateAnnouncementSubscriptions < ActiveRecord::Migration
  def change
    create_table :announcement_subscriptions do |t|
      t.references :user

      t.timestamps
    end
    add_index :announcement_subscriptions, :user_id
  end
end
