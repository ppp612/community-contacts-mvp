"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { LANGUAGE_OPTIONS, MAIN_CONCERN_OPTIONS, SOURCE_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/browser";

type UiLanguage = "en" | "zh" | "ko" | "vi";

const uiLanguages: { code: UiLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" }
];

const translations = {
  en: {
    badge: "Community updates",
    title: "Stay connected and share what matters locally",
    subtitle:
      "Leave your details to receive Mayor Cai's community updates, share a local concern, or request follow-up from the team.",
    detailsTitle: "Your details",
    detailsHelp: "Tell us how the team can reach you.",
    fullName: "Full name *",
    mobile: "Mobile",
    email: "Email",
    suburb: "Suburb *",
    address: "Address, optional",
    addressPlaceholder: "Unit / street address, optional",
    preferredLanguage: "Preferred language",
    localConcernTitle: "What would you like us to know?",
    localConcernHelp: "Share a local issue, place, or idea you would like the team to understand.",
    mainConcern: "Main concern",
    source: "How did you hear about this form?",
    nearbyLocation: "Street or nearby location, optional",
    nearbyPlaceholder: "Example: near Station Street",
    message: "Message",
    stayInvolvedTitle: "Stay involved",
    stayInvolvedHelp: "Let us know how you would like to stay connected.",
    volunteer: "Would you like to help with future community activities?",
    membership: "Would you like to learn more about getting involved in our community network?",
    consentTitle: "Consent",
    consent:
      "I agree to receive community updates and follow-up messages. I understand I can unsubscribe or request removal at any time.",
    select: "Select",
    submit: "Submit details",
    submitting: "Submitting...",
    consentError: "Please confirm consent before submitting.",
    submitError: "Something went wrong. Please try again.",
    thankYouTitle: "Thank you.",
    thankYouMessage: "Your details have been submitted."
  },
  zh: {
    badge: "社区更新",
    title: "保持联系，也说说社区里值得关注的事",
    subtitle: "留下联系方式，接收蔡市长团队的社区更新；如果有想反映的问题，也可以告诉我们，方便团队后续跟进。",
    detailsTitle: "您的联系方式",
    detailsHelp: "方便团队在需要时与您联系。",
    fullName: "姓名 *",
    mobile: "手机",
    email: "邮箱",
    suburb: "居住区域 *",
    address: "住址，可选",
    addressPlaceholder: "单元号 / 街道地址，可选",
    preferredLanguage: "偏好语言",
    localConcernTitle: "有什么想让团队了解的吗？",
    localConcernHelp: "可以写下您看到的问题、具体地点，或对社区服务的建议。",
    mainConcern: "主要关注事项",
    source: "您是通过哪里看到这个表格的？",
    nearbyLocation: "相关街道或附近地点，可选",
    nearbyPlaceholder: "例如：靠近 Station Street",
    message: "补充说明",
    stayInvolvedTitle: "继续参与社区",
    stayInvolvedHelp: "如果您愿意，也可以告诉我们未来如何与您保持联系。",
    volunteer: "您愿意帮忙参与未来的社区活动吗？",
    membership: "您想了解更多参与社区网络的方式吗？",
    consentTitle: "同意接收信息",
    consent: "我同意接收社区更新和后续跟进信息。我了解我可以随时取消订阅或要求删除资料。",
    select: "请选择",
    submit: "提交信息",
    submitting: "提交中...",
    consentError: "请先勾选同意授权再提交。",
    submitError: "提交失败，请稍后再试。",
    thankYouTitle: "谢谢您。",
    thankYouMessage: "您的信息已经成功提交。"
  },
  ko: {
    badge: "커뮤니티 소식",
    title: "소식을 받아보고, 동네에서 중요한 일도 알려 주세요",
    subtitle: "연락처를 남겨 주시면 차이 시장 팀의 커뮤니티 소식을 받아보실 수 있습니다. 지역에서 불편한 점이나 살펴봐야 할 일이 있으면 함께 알려 주세요.",
    detailsTitle: "연락처 정보",
    detailsHelp: "필요할 때 팀에서 연락드릴 수 있도록 알려 주세요.",
    fullName: "성명 *",
    mobile: "휴대전화",
    email: "이메일",
    suburb: "거주 지역 *",
    address: "주소, 선택 사항",
    addressPlaceholder: "유닛 / 도로명 주소, 선택 사항",
    preferredLanguage: "선호 언어",
    localConcernTitle: "팀이 알아두면 좋을 내용이 있나요?",
    localConcernHelp: "지역의 불편 사항, 장소, 또는 커뮤니티에 대한 의견을 편하게 남겨 주세요.",
    mainConcern: "주요 관심 분야",
    source: "이 양식은 어디에서 보셨나요?",
    nearbyLocation: "관련 거리 또는 가까운 장소, 선택 사항",
    nearbyPlaceholder: "예: Station Street 근처",
    message: "추가로 남기고 싶은 내용",
    stayInvolvedTitle: "계속 함께하기",
    stayInvolvedHelp: "앞으로 어떤 방식으로 소식을 받고 참여하고 싶은지 알려 주세요.",
    volunteer: "앞으로 커뮤니티 활동을 도와주실 의향이 있으신가요?",
    membership: "커뮤니티 네트워크에 참여하는 방법을 더 알고 싶으신가요?",
    consentTitle: "동의",
    consent: "커뮤니티 소식과 후속 연락을 받는 데 동의합니다. 언제든지 구독 취소 또는 정보 삭제를 요청할 수 있음을 이해합니다.",
    select: "선택",
    submit: "정보 제출",
    submitting: "제출 중...",
    consentError: "제출 전에 동의 항목을 확인해 주세요.",
    submitError: "문제가 발생했습니다. 다시 시도해 주세요.",
    thankYouTitle: "감사합니다.",
    thankYouMessage: "정보가 제출되었습니다."
  },
  vi: {
    badge: "Cập nhật cộng đồng",
    title: "Giữ liên lạc và chia sẻ điều bạn quan tâm trong cộng đồng",
    subtitle:
      "Để lại thông tin để nhận cập nhật từ đội ngũ của Thị trưởng Cai. Nếu có vấn đề ở khu vực của bạn, bạn cũng có thể cho chúng tôi biết để tiện theo dõi.",
    detailsTitle: "Thông tin của bạn",
    detailsHelp: "Thông tin này giúp nhóm liên hệ với bạn khi cần.",
    fullName: "Họ và tên *",
    mobile: "Số điện thoại",
    email: "Email",
    suburb: "Khu vực sinh sống *",
    address: "Địa chỉ, không bắt buộc",
    addressPlaceholder: "Số căn / địa chỉ đường, không bắt buộc",
    preferredLanguage: "Ngôn ngữ ưu tiên",
    localConcernTitle: "Có điều gì bạn muốn đội ngũ biết thêm không?",
    localConcernHelp: "Bạn có thể ghi lại vấn đề, địa điểm cụ thể hoặc góp ý về dịch vụ cộng đồng.",
    mainConcern: "Nội dung bạn quan tâm nhất",
    source: "Bạn biết đến biểu mẫu này từ đâu?",
    nearbyLocation: "Tên đường hoặc địa điểm liên quan, không bắt buộc",
    nearbyPlaceholder: "Ví dụ: gần Station Street",
    message: "Ghi chú thêm",
    stayInvolvedTitle: "Tiếp tục tham gia cùng cộng đồng",
    stayInvolvedHelp: "Nếu muốn, bạn có thể cho chúng tôi biết cách bạn muốn giữ liên lạc trong thời gian tới.",
    volunteer: "Bạn có muốn hỗ trợ các hoạt động cộng đồng trong tương lai?",
    membership: "Bạn có muốn tìm hiểu thêm về cách tham gia mạng lưới cộng đồng?",
    consentTitle: "Đồng ý nhận thông tin",
    consent:
      "Tôi đồng ý nhận thông tin cập nhật cộng đồng và tin nhắn theo dõi. Tôi hiểu rằng tôi có thể hủy đăng ký hoặc yêu cầu xóa thông tin bất cứ lúc nào.",
    select: "Chọn",
    submit: "Gửi thông tin",
    submitting: "Đang gửi...",
    consentError: "Vui lòng xác nhận đồng ý trước khi gửi.",
    submitError: "Đã xảy ra lỗi. Vui lòng thử lại.",
    thankYouTitle: "Cảm ơn bạn.",
    thankYouMessage: "Thông tin của bạn đã được gửi."
  }
} satisfies Record<UiLanguage, Record<string, string>>;

const languageLabels: Record<UiLanguage, Record<string, string>> = {
  en: {
    English: "English",
    Chinese: "Chinese",
    Korean: "Korean",
    Vietnamese: "Vietnamese",
    Other: "Other"
  },
  zh: {
    English: "英文",
    Chinese: "中文",
    Korean: "韩文",
    Vietnamese: "越南语",
    Other: "其他"
  },
  ko: {
    English: "영어",
    Chinese: "중국어",
    Korean: "한국어",
    Vietnamese: "베트남어",
    Other: "기타"
  },
  vi: {
    English: "Tiếng Anh",
    Chinese: "Tiếng Trung",
    Korean: "Tiếng Hàn",
    Vietnamese: "Tiếng Việt",
    Other: "Khác"
  }
};

const concernLabels: Record<UiLanguage, Record<string, string>> = {
  en: {
    Parking: "Parking",
    Traffic: "Traffic",
    Safety: "Safety",
    Roads: "Roads",
    Parks: "Parks",
    Cleanliness: "Cleanliness",
    Seniors: "Seniors",
    Youth: "Youth",
    "Local Business": "Local Business",
    "Community Facilities": "Community Facilities",
    Other: "Other"
  },
  zh: {
    Parking: "停车",
    Traffic: "交通",
    Safety: "安全",
    Roads: "道路",
    Parks: "公园",
    Cleanliness: "环境清洁",
    Seniors: "长者",
    Youth: "青年",
    "Local Business": "本地商户",
    "Community Facilities": "社区设施",
    Other: "其他"
  },
  ko: {
    Parking: "주차",
    Traffic: "교통",
    Safety: "안전",
    Roads: "도로",
    Parks: "공원",
    Cleanliness: "청결",
    Seniors: "어르신",
    Youth: "청소년",
    "Local Business": "지역 상권",
    "Community Facilities": "커뮤니티 시설",
    Other: "기타"
  },
  vi: {
    Parking: "Đỗ xe",
    Traffic: "Giao thông",
    Safety: "An toàn",
    Roads: "Đường sá",
    Parks: "Công viên",
    Cleanliness: "Vệ sinh môi trường",
    Seniors: "Người cao tuổi",
    Youth: "Thanh thiếu niên",
    "Local Business": "Doanh nghiệp địa phương",
    "Community Facilities": "Cơ sở cộng đồng",
    Other: "Khác"
  }
};

const sourceLabels: Record<UiLanguage, Record<string, string>> = {
  en: {
    "Meet with Residents": "Meet with Residents",
    Facebook: "Facebook",
    TikTok: "TikTok",
    WeChat: "WeChat",
    "Community Event": "Community Event",
    "Local Business Walk": "Local Business Walk",
    "Friend Referral": "Friend Referral",
    Other: "Other"
  },
  zh: {
    "Meet with Residents": "居民见面会",
    Facebook: "Facebook",
    TikTok: "TikTok",
    WeChat: "微信",
    "Community Event": "社区活动",
    "Local Business Walk": "商圈走访",
    "Friend Referral": "朋友介绍",
    Other: "其他"
  },
  ko: {
    "Meet with Residents": "주민 만남",
    Facebook: "Facebook",
    TikTok: "TikTok",
    WeChat: "WeChat",
    "Community Event": "커뮤니티 행사",
    "Local Business Walk": "상권 방문",
    "Friend Referral": "지인 소개",
    Other: "기타"
  },
  vi: {
    "Meet with Residents": "Gặp gỡ cư dân",
    Facebook: "Facebook",
    TikTok: "TikTok",
    WeChat: "WeChat",
    "Community Event": "Sự kiện cộng đồng",
    "Local Business Walk": "Gặp gỡ doanh nghiệp địa phương",
    "Friend Referral": "Bạn bè giới thiệu",
    Other: "Khác"
  }
};

const initialForm = {
  full_name: "",
  mobile: "",
  email: "",
  suburb: "",
  address: "",
  language_preference: "",
  main_concern: "",
  source: "",
  location_detail: "",
  message: "",
  volunteer_interest: false,
  membership_interest: false,
  consent: false
};

export default function PublicContactFormPage() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const t = translations[uiLanguage];

  function updateField(name: keyof typeof initialForm, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.consent) {
      setError(t.consentError);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("contacts").insert({
      full_name: form.full_name.trim(),
      mobile: form.mobile.trim() || null,
      email: form.email.trim() || null,
      suburb: form.suburb.trim(),
      address: form.address.trim() || null,
      language_preference: form.language_preference || null,
      main_concern: form.main_concern || null,
      source: form.source || null,
      location_detail: form.location_detail.trim() || null,
      message: form.message.trim() || null,
      volunteer_interest: form.volunteer_interest,
      membership_interest: form.membership_interest,
      consent: form.consent
    });

    setSubmitting(false);

    if (insertError) {
      setError(t.submitError);
      return;
    }

    setForm(initialForm);
    setSuccess(true);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-8 sm:px-6">
        <section className="w-full max-w-[720px] rounded-lg bg-white p-6 text-center shadow-soft sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Send aria-hidden="true" className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            {t.thankYouTitle}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{t.thankYouMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-neutral-100 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
      <section className="mx-auto w-full max-w-[720px]">
        <header className="mb-5 text-center sm:mb-7">
          <div
            aria-label="Choose form language"
            className="mx-auto mb-5 grid w-full max-w-md grid-cols-2 rounded-md border border-slate-300 bg-white p-1 shadow-sm sm:grid-cols-4"
            role="group"
          >
            {uiLanguages.map((language) => {
              const active = uiLanguage === language.code;
              return (
                <button
                  key={language.code}
                  type="button"
                  className={`h-10 rounded px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                  aria-pressed={active}
                  onClick={() => setUiLanguage(language.code)}
                >
                  {language.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm font-semibold uppercase tracking-normal text-slate-500">{t.badge}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{t.subtitle}</p>
        </header>

        <form className="space-y-7 rounded-lg bg-white p-5 shadow-soft sm:p-7" onSubmit={submitForm}>
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t.detailsTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.detailsHelp}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-slate-800">{t.fullName}</span>
                <input
                  required
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{t.mobile}</span>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.mobile}
                  onChange={(event) => updateField("mobile", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{t.email}</span>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{t.suburb}</span>
                <input
                  required
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  autoComplete="address-level2"
                  value={form.suburb}
                  onChange={(event) => updateField("suburb", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{t.address}</span>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  autoComplete="street-address"
                  placeholder={t.addressPlaceholder}
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{t.preferredLanguage}</span>
                <select
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                  value={form.language_preference}
                  onChange={(event) => updateField("language_preference", event.target.value)}
                >
                  <option value="">{t.select}</option>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {languageLabels[uiLanguage][option]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t.localConcernTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.localConcernHelp}</p>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">{t.mainConcern}</span>
              <select
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                value={form.main_concern}
                onChange={(event) => updateField("main_concern", event.target.value)}
              >
                <option value="">{t.select}</option>
                {MAIN_CONCERN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {concernLabels[uiLanguage][option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">{t.source}</span>
              <select
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
              >
                <option value="">{t.select}</option>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {sourceLabels[uiLanguage][option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">{t.nearbyLocation}</span>
              <input
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                placeholder={t.nearbyPlaceholder}
                autoComplete="street-address"
                value={form.location_detail}
                onChange={(event) => updateField("location_detail", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">{t.message}</span>
              <textarea
                className="min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-4 focus:ring-slate-200"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </label>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t.stayInvolvedTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.stayInvolvedHelp}</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-300 bg-neutral-50 p-4 text-base leading-7 text-slate-800 transition hover:border-slate-500">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-slate-800"
                checked={form.volunteer_interest}
                onChange={(event) => updateField("volunteer_interest", event.target.checked)}
              />
              <span>{t.volunteer}</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-300 bg-neutral-50 p-4 text-base leading-7 text-slate-800 transition hover:border-slate-500">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-slate-800"
                checked={form.membership_interest}
                onChange={(event) => updateField("membership_interest", event.target.checked)}
              />
              <span>{t.membership}</span>
            </label>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-950">{t.consentTitle}</h2>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-300 bg-white p-4 text-base leading-7 text-slate-800 transition hover:border-slate-500">
              <input
                required
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-slate-800"
                checked={form.consent}
                onChange={(event) => updateField("consent", event.target.checked)}
              />
              <span>{t.consent}</span>
            </label>
          </section>

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-base font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
