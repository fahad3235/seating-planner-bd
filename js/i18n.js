// EN / বাংলা strings for Seating Planner BD. Rendered via textContent only.
(function (root) {
  'use strict';
  var STR = {
    en: {
      title: 'Seating Planner BD',
      subtitle: 'Arrange classroom and exam-hall seats in seconds — fully offline, in your browser.',
      studentsLabel: 'Student names',
      studentsHint: 'One name per line. Paste a class list to start.',
      studentsCount: '{n} students',
      demoBtn: 'Load demo class',
      clearNamesBtn: 'Clear names',
      hallLabel: 'Hall layout',
      rowsLabel: 'Rows',
      colsLabel: 'Columns',
      modeLabel: 'Arrangement',
      modeRandom: 'Random shuffle',
      modeAlphaSnake: 'Alphabetical (snake rows)',
      modeSpaced: 'Spaced out (exam mode)',
      capacityHint: 'Seats: {n}',
      spacedHint: 'Exam mode seats at most {n} students in this hall.',
      generateBtn: 'Generate plan',
      regenerateBtn: 'Shuffle again',
      clearPlanBtn: 'Clear plan',
      copyBtn: 'Copy plan as text',
      copiedMsg: 'Copied to clipboard!',
      copyReadyMsg: 'Clipboard is not available here — copy the text below manually:',
      planTitle: 'Seating plan',
      noPlanMsg: 'No plan yet — add student names and press Generate plan.',
      seatDetailHint: 'Tap a seat to see its details.',
      seatDetail: 'Seat {seat} — Row {row}, Column {col}: {name}',
      seatWord: 'Seat',
      rowWord: 'Row',
      colWord: 'Column',
      emptyWord: 'Empty',
      frontLabel: 'Board / Teacher — front of room',
      errTooFew: 'Add at least 2 students.',
      errTooMany: 'Students ({s}) exceed seats ({c}). Increase rows or columns.',
      errTooManySpaced: 'Exam mode fits at most {c} students here, but you have {s}.',
      errBadSize: 'Rows and columns must be whole numbers from 2 to 10.',
      footerNote: 'Fully offline — names and plans never leave your browser.',
      langBtn: 'বাংলা'
    },
    bn: {
      title: 'সিট প্ল্যানার বিডি',
      subtitle: 'কয়েক সেকেন্ডে ক্লাসরুম ও পরীক্ষার হলের আসন সাজান — সম্পূর্ণ অফলাইনে, আপনার ব্রাউজারেই।',
      studentsLabel: 'শিক্ষার্থীদের নাম',
      studentsHint: 'প্রতি লাইনে একটি নাম লিখুন। ক্লাসের তালিকা পেস্ট করে শুরু করুন।',
      studentsCount: '{n} জন শিক্ষার্থী',
      demoBtn: 'ডেমো ক্লাস লোড করুন',
      clearNamesBtn: 'নাম মুছুন',
      hallLabel: 'হলের বিন্যাস',
      rowsLabel: 'সারি',
      colsLabel: 'কলাম',
      modeLabel: 'সাজানোর ধরন',
      modeRandom: 'এলোমেলো',
      modeAlphaSnake: 'বর্ণানুক্রমিক (সাপের মতো সারি)',
      modeSpaced: 'ফাঁকা রেখে (পরীক্ষার ধরন)',
      capacityHint: 'আসন সংখ্যা: {n}',
      spacedHint: 'পরীক্ষার ধরনে এই হলে সর্বোচ্চ {n} জন বসতে পারবে।',
      generateBtn: 'পরিকল্পনা তৈরি করুন',
      regenerateBtn: 'আবার সাজান',
      clearPlanBtn: 'পরিকল্পনা মুছুন',
      copyBtn: 'টেক্সট হিসেবে কপি করুন',
      copiedMsg: 'ক্লিপবোর্ডে কপি হয়েছে!',
      copyReadyMsg: 'এখানে ক্লিপবোর্ড পাওয়া যাচ্ছে না — নিচের টেক্সটটি নিজে কপি করুন:',
      planTitle: 'আসন পরিকল্পনা',
      noPlanMsg: 'এখনো কোনো পরিকল্পনা নেই — শিক্ষার্থীর নাম যোগ করে "পরিকল্পনা তৈরি করুন" চাপুন।',
      seatDetailHint: 'বিস্তারিত দেখতে একটি আসনে ট্যাপ করুন।',
      seatDetail: 'আসন {seat} — সারি {row}, কলাম {col}: {name}',
      seatWord: 'আসন',
      rowWord: 'সারি',
      colWord: 'কলাম',
      emptyWord: 'খালি',
      frontLabel: 'বোর্ড / শিক্ষক — সামনের দিক',
      errTooFew: 'কমপক্ষে ২ জন শিক্ষার্থী লাগবে।',
      errTooMany: 'শিক্ষার্থী ({s}) আসন ({c})-এর চেয়ে বেশি। সারি বা কলাম বাড়ান।',
      errTooManySpaced: 'পরীক্ষার ধরনে এখানে সর্বোচ্চ {c} জন বসতে পারবে, কিন্তু শিক্ষার্থী {s} জন।',
      errBadSize: 'সারি ও কলাম ২ থেকে ১০-এর মধ্যে পূর্ণসংখ্যা হতে হবে।',
      footerNote: 'সম্পূর্ণ অফলাইন — নাম ও পরিকল্পনা শুধু আপনার ব্রাউজারেই থাকে।',
      langBtn: 'English'
    }
  };

  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  var api = { STR: STR, toBnDigits: toBnDigits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.I18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
