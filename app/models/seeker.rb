# -*- coding: utf-8 -*-
class Seeker < ActiveRecord::Base
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  has_one_address

  attr_accessible :firstname, :lastname, :source, :preferred_way_of_contact, :invite, :status

  validates_presence_of :firstname, :lastname, :source, :status

  default_scope where(:deleted => false)

  WAY_OF_CONTACT = {
    email: 10,
    phone: 20,
    fax: 30,
    mobile: 40,
    mail: 50,
    see_remarks: 100
  }

  WAY_OF_CONTACT.each_pair{|type,id|
    self.class_eval %{
      def #{type}?
        preferred_way_of_contact == #{id}
      end
    }
  }


  def contact_data
    case preferred_way_of_contact
    when 10
        return address.email
    when 20
        return address.phone
    when 30
        return address.fax
    when 40
        return address.mobile
    when 50
        return address.to_s
    when 100
        return address.remarks
    else
      nil
    end
  end

  STATUS = {
    contacted:                0,
    visiting:                10,
    application_expected:    20,
    application_received:    30,
    ballotage_scheduled:     40,
    ready_for_admission:     50,
    admission_scheduled:     60,
    accepted:               100,
    declined:              1000
  }

  STATUS.each_pair{|type,id|
    self.class_eval %{
      def #{type}?
        status == #{id}
      end
    }
  }

  def current_status
    Seeker::STATUS.each_pair do |k,v|
      if status == v 
        return I18n.t("activerecord.seeker.status.#{k}")
      end
    end
    nil
  end
end
