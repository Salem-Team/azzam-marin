# Change Governance

## Design review checklist
- [ ] Tokens used (no rogue hex)  
- [ ] Type/spacing match scale  
- [ ] No unnecessary descriptions under titles/sections (CONTENT_DISCIPLINE)  
- [ ] EN + AR copy present  
- [ ] RTL/LTR OK  
- [ ] A11y names/focus  
- [ ] Motion within tokens  
- [ ] No scope creep modules  

## Code review checklist
- [ ] Reused shared components  
- [ ] No duplicate nav/i18n  
- [ ] No backend introduced  
- [ ] Types strict  
- [ ] Lint/typecheck/build considered  

## Exception process
1. State the rule being broken.  
2. Justify with user/workflow need.  
3. Time-box the exception.  
4. Prefer upstreaming into the design system within one iteration.  

## What is automated vs manual
| Automated | Manual |
|-----------|--------|
| Lint, tsc, build | Visual hierarchy, brand feel, RTL polish, motion taste |
