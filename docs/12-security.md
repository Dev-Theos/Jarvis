# 12. Security Model

| Threat | Mitigation |
|--------|------------|
| Prompt injection | System rules pinned; untrusted content wrapped; tools ignore “authority” claims in data |
| Malicious webpages | Fetch as text; no implicit code exec; sandbox |
| Malicious files | Read as data; scripts only via confirmed shell |
| Unauthorized tool use | Registry + permission gate + session policy |
| Accidental destruction | Delete/high-risk confirmations; deny-by-default timeouts |
| Credential theft | safeStorage; never echo secrets to model/UI/logs |
| API key exposure | Main process only; scrubber on logs/prompts |
| Social engineering | JARVIS will not change security policy because a site/email asked |
| Unauthorized communications | confirm/high-risk on message/call tools |

**Invariant:** User permissions and JARVIS core security always outrank tool/website/model requests.
