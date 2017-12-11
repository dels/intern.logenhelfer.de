require 'rest_client'

class UploadToFileIoJob < ActiveJob::Base
  self.queue_adapter = :resque
  queue_as :default

  def perform(file, user)
    lnk = nil
    raise "no file" unless file
    raise "no content" unless file.content
    res = nil
    begin
      res = RestClient.post("https://file.io/?expires=1w",
                            {
                              multipart: true,
                              file: stringfile(file.content, file.filename, file.content_type)
                            },
                            headers = {
                              content_type: "multipart/form-data",
                              accept: :json
                            }
                           )
    rescue RestClient::ExceptionWithResponse => e
      case e.http_code
      when 404
        Rails.logger.fatal("Resource not found")
      when 400
        Rails.logger.fatal("Bad Request: #{e.http_body}")
      else
        Rails.logger.fatal("I don't catch code #{e.http_code} of exception #{e}")
        Rails.logger.fatal("#{e.methods.sort!}")
        Rails.logger.fatal("#{e.http_body}")
      end
    end
    return unless res
    json = JSON::parse(res)
    FileMailer.file_upload_success_mail(user, json['link']).deliver_later
  end

  private
  
  def stringfile(content, filename, content_type)
    file = StringIO.new(content)
    
    file.instance_variable_set(:@path, filename)
    def file.path
      @path
    end
    
    file.instance_variable_set(:@content_type, content_type)
    def file.content_type
      @content_type
    end
    
    return file
  end
end
