# -*- coding: utf-8 -*-
class Seeker < ApplicationRecord
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  has_one_address

  validates_presence_of :firstname, :lastname, :source, :status

  before_validation :update_status

  validate :way_of_contact_validation

  default_scope { where(:deleted => false) }

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
  
  def way_of_contact_validation
    case preferred_way_of_contact
    when 10
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_mail_but_no_mail")) if address.email.empty?
    when 20
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_phone_but_no_phone")) if address.phone.empty?
    when 30
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_fax_but_no_fax")) if address.fax.empty?
    when 40
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_mobile_but_no_mobile")) if address.mobile.empty?
    when 50
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_address_but_no_address")) if address.to_s.empty?
    when 100
      errors.add(:preferred_way_of_contact, I18n.t("activerecord.seeker.error.contact_via_remarks_but_no_remarks")) if address.remarks.empty?
    end
  end
  
  def update_status
    if status == STATUS[:declined]
      self.invite = false
    end
    true
  end
  
  def current_status
    Seeker::STATUS.each_pair do |k,v|
      if status == v 
        return I18n.t("activerecord.seeker.status.#{k}")
      end
    end
    nil
  end

  def fullname
    [ firstname, lastname].join(' ')
  end
end
