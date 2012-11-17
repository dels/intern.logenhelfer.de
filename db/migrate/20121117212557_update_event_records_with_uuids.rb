class UpdateEventRecordsWithUuids < ActiveRecord::Migration
  def up
    Event.find_each do |e|
      begin
        e.uuid = SecureRandom.uuid
      end while Event.exists?(uuid: e.uuid)
      e.save
    end
  end

  def down
  end
end
