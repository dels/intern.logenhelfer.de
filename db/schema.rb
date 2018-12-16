# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180527073059) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "academic_titles", id: :serial, force: :cascade do |t|
    t.string "title", limit: 255
    t.string "short", limit: 255
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["short"], name: "index_academic_titles_on_short", unique: true
    t.index ["title"], name: "index_academic_titles_on_title", unique: true
  end

  create_table "addresses", id: :serial, force: :cascade do |t|
    t.integer "addressable_id"
    t.string "addressable_type", limit: 255
    t.string "purpose", limit: 255, default: "geschäftlich"
    t.string "street1", limit: 255
    t.string "street2", limit: 255
    t.string "street3", limit: 255
    t.string "zip", limit: 255
    t.string "city", limit: 255
    t.string "phone", limit: 255
    t.string "fax", limit: 255
    t.string "email", limit: 255
    t.text "remarks"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "type_of_address"
    t.string "mobile", limit: 255
  end

  create_table "announcement_subscriptions", id: :serial, force: :cascade do |t|
    t.integer "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_announcement_subscriptions_on_user_id"
  end

  create_table "announcements", id: :serial, force: :cascade do |t|
    t.string "uuid", limit: 255
    t.string "title", limit: 255
    t.text "message_body"
    t.integer "created_by_id"
    t.integer "updated_by_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "app_config_adapters", id: :serial, force: :cascade do |t|
    t.string "key", limit: 255
    t.text "value"
    t.index ["key"], name: "index_app_config_adapters_on_key", unique: true
  end

  create_table "attached_file_roles", id: :serial, force: :cascade do |t|
    t.integer "attached_file_id"
    t.integer "role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["attached_file_id"], name: "index_attached_file_roles_on_attached_file_id"
    t.index ["role_id"], name: "index_attached_file_roles_on_role_id"
  end

  create_table "attached_files", id: :serial, force: :cascade do |t|
    t.string "uuid", limit: 36
    t.string "filename", limit: 255
    t.binary "content"
    t.string "content_type", limit: 255
    t.integer "directory_id"
    t.integer "uploader_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "content_length", default: -1
    t.index ["deleted"], name: "index_attached_files_on_deleted"
    t.index ["directory_id"], name: "index_attached_files_on_directory_id"
    t.index ["filename"], name: "index_attached_files_on_filename"
  end

  create_table "categories", id: :serial, force: :cascade do |t|
    t.string "name", limit: 255
    t.text "description"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "slug", limit: 255
    t.string "uuid"
    t.index ["slug"], name: "index_categories_on_slug"
    t.index ["uuid"], name: "index_categories_on_uuid"
  end

  create_table "category_roles", id: :serial, force: :cascade do |t|
    t.integer "category_id"
    t.integer "role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_category_roles_on_category_id"
    t.index ["role_id"], name: "index_category_roles_on_role_id"
  end

  create_table "directories", id: :serial, force: :cascade do |t|
    t.string "name", limit: 255
    t.text "description"
    t.integer "category_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "slug", limit: 255
    t.string "uuid"
    t.index ["category_id"], name: "index_directories_on_category_id"
    t.index ["deleted"], name: "index_directories_on_deleted"
    t.index ["slug"], name: "index_directories_on_slug"
    t.index ["uuid"], name: "index_directories_on_uuid"
  end

  create_table "directory_roles", id: :serial, force: :cascade do |t|
    t.integer "directory_id"
    t.integer "role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["directory_id"], name: "index_directory_roles_on_directory_id"
    t.index ["role_id"], name: "index_directory_roles_on_role_id"
  end

  create_table "districts", id: :serial, force: :cascade do |t|
    t.string "slug", limit: 255
    t.string "name", limit: 255
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "event_participants", force: :cascade do |t|
    t.integer "user_id"
    t.integer "event_id"
    t.boolean "festive_board", default: false
    t.boolean "subscription_confirmed", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "events", id: :serial, force: :cascade do |t|
    t.string "title", limit: 255
    t.text "public_description"
    t.text "private_description"
    t.boolean "whole_day"
    t.integer "created_by_id"
    t.integer "updated_by_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "date", null: false
    t.time "time"
    t.string "uuid", limit: 36
    t.string "location", limit: 255
    t.index ["created_by_id"], name: "index_events_on_created_by_id"
    t.index ["updated_by_id"], name: "index_events_on_updated_by_id"
  end

  create_table "external_event_participants", id: :serial, force: :cascade do |t|
    t.integer "user_id"
    t.integer "external_event_id"
    t.boolean "subscription_confirmed", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "festive_board", default: false
  end

  create_table "external_events", id: :serial, force: :cascade do |t|
    t.string "uuid", limit: 255
    t.string "title", limit: 255, null: false
    t.text "description"
    t.string "location", limit: 255, null: false
    t.time "time", null: false
    t.date "date", null: false
    t.integer "created_by_id", null: false
    t.integer "updated_by_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "host", limit: 255
  end

  create_table "file_downloads", id: :serial, force: :cascade do |t|
    t.integer "attached_file_id"
    t.integer "user_id"
    t.string "remote_ip", limit: 255
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "filename", limit: 255
    t.index ["deleted"], name: "index_file_downloads_on_deleted"
    t.index ["user_id"], name: "index_file_downloads_on_user_id"
  end

  create_table "friendly_id_slugs", id: :serial, force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type"
    t.index ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id"
    t.index ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type"
  end

  create_table "lodges", id: :serial, force: :cascade do |t|
    t.string "slug", limit: 255
    t.string "name", limit: 255
    t.text "description"
    t.integer "district_id"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "officers", id: :serial, force: :cascade do |t|
    t.string "uuid", limit: 255
    t.integer "lodge_id"
    t.string "firstname", limit: 255
    t.string "lastname", limit: 255
    t.integer "role_id"
    t.string "role_email", limit: 255
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "roles", id: :serial, force: :cascade do |t|
    t.string "name", limit: 255
    t.string "description", limit: 255
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "display_name", limit: 255
    t.boolean "group", default: false
    t.boolean "administrational_role", default: true
    t.string "email", limit: 255
    t.integer "ordering_number"
    t.boolean "deleted", default: false
    t.boolean "admin_role", default: false
    t.boolean "officer_role", default: false
    t.integer "index"
  end

  create_table "seekers", id: :serial, force: :cascade do |t|
    t.string "firstname", limit: 255
    t.string "lastname", limit: 255
    t.string "source", limit: 255
    t.boolean "invite"
    t.boolean "deleted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "uuid", limit: 36
    t.integer "preferred_way_of_contact"
    t.integer "status"
    t.text "notes"
  end

  create_table "user_roles", id: :serial, force: :cascade do |t|
    t.integer "user_id"
    t.integer "role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "role_added_at"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "email", limit: 255, default: "", null: false
    t.string "encrypted_password", limit: 255, default: "", null: false
    t.string "reset_password_token", limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip", limit: 255
    t.string "last_sign_in_ip", limit: 255
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "uuid", limit: 255
    t.string "firstname", limit: 255
    t.string "lastname", limit: 255
    t.date "date_of_birth"
    t.date "accepted_at"
    t.boolean "deleted", default: false
    t.integer "matriculation_number"
    t.string "job_title", limit: 255
    t.integer "title"
    t.integer "academic_title_id"
    t.string "mother_lodge", limit: 255
    t.string "provider", limit: 255
    t.string "g_uid", limit: 255
    t.string "g_name", limit: 255
    t.string "g_mail", limit: 255
    t.string "oauth_token", limit: 255
    t.datetime "oauth_expires_at"
    t.boolean "accepted_gdpr", default: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uuid"], name: "index_users_on_uuid"
  end

end
