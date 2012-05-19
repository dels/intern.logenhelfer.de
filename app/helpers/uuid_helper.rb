module UuidHelper

  def generate_uuid
    begin
      self.uuid = SecureRandom.uuid
    end while self.class.exists?(:uuid => self.uuid)
  end

end

