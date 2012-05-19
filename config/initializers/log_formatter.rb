class Logger::SimpleFormatter
  # from activesupport/lib/active_support/core_ext/logger.rb
  def call(severity, time, progname, msg)
    prefix_lines "#{String === msg ? msg : msg.inspect}", severity_color(severity)
  end

private

  def prefix_lines(lines, prefix)
    lines.split("\n").map{|e| e.gsub(/^(?!$)/, prefix) }.join("\n") + "\n"
  end

  def severity_color(severity)
    case severity
    when 'DEBUG'
      "\033[0;34;40mDEBUG\033[0m   " # blue
    when 'INFO'
      "\033[1;37;40mINFO\033[0m    " # bold white
    when 'WARN'
      "\033[1;33;40mWARNING\033[0m " # bold yellow
    when 'ERROR'
      "\033[1;31;40mERROR\033[0m   " # bold red
    when 'FATAL'
      "\033[7;31;40mFATAL\033[0m   " # bold black, red bg
    else
      "#{severity} " # none
    end
  end
end