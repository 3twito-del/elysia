# Search Control Benchmark

Date: 2026-05-20

Corpus: the project benchmark set in `src/lib/public-design-policy.ts`: Cartier, Tiffany & Co., Van Cleef & Arpels, Bulgari, Harry Winston, Graff, Chopard, Boucheron, Chaumet, Piaget, Mikimoto, Messika, Buccellati, De Beers, Pomellato, David Yurman, Pandora, Swarovski, Mejuri, Brilliant Earth, Blue Nile, James Allen, Kay Jewelers, Zales, Jared, VRAI, Catbird, Aurate, Monica Vinader, Kendra Scott.

Official sites opened for current-pattern sanity checks: https://www.cartier.com/, https://www.tiffany.com/, https://www.vancleefarpels.com/, https://www.bulgari.com/, https://www.harrywinston.com/, https://www.graff.com/, https://www.chopard.com/, https://www.boucheron.com/, https://www.chaumet.com/, https://www.piaget.com/, https://www.messika.com/, https://www.buccellati.com/, https://www.debeers.com/, https://www.pomellato.com/, https://www.davidyurman.com/, https://www.pandora.net/, https://www.swarovski.com/, https://mejuri.com/, https://www.brilliantearth.com/, https://www.bluenile.com/, https://www.jamesallen.com/, https://www.kay.com/, https://www.zales.com/, https://www.jared.com/, https://www.vrai.com/, https://auratenewyork.com/, https://www.monicavinader.com/, https://www.kendrascott.com/.

## 120 Measurable Parameters

1. Control height: 48-56px on desktop.
2. Control height: 44-52px on mobile.
3. Submit button height: equal to input height.
4. Input border width: 1px default.
5. Focus border width: visual 2-3px through ring, not layout shift.
6. Border radius: 6-8px, not pill-like.
7. Outer panel radius: 6-8px.
8. Icon size: 16-18px in input.
9. Button icon size: 16px.
10. Input horizontal padding: 40-44px on icon side, 12-16px on text side.
11. Button horizontal padding: 16-22px.
12. Panel padding: 6-10px around controls.
13. Desktop gap between input and button: 8-12px.
14. Mobile gap between rows: 8-12px.
15. Suggested-chip height: 28-34px.
16. Section placement: directly after hero.
17. Section must be above categories.
18. Section top padding: compact, 16-24px.
19. Section bottom padding: compact, 16-24px.
20. Control max width: 56-68rem.
21. Copy column max width: 18-24rem.
22. Desktop layout: copy and search on one row.
23. Mobile layout: copy above search.
24. Desktop alignment: center vertically.
25. RTL input text alignment: right.
26. Search icon side: inline-start for RTL, visually right.
27. Submit side: inline-end for RTL, visually left.
28. Form should not overlap hero or next section.
29. Eyebrow weight: medium.
30. Eyebrow font size: 12-14px.
31. Heading font size: 24-32px.
32. Heading line height: 1.15-1.25.
33. Input font size: 14-16px.
34. Placeholder font size: same as input or 1px smaller.
35. Button font size: 14-15px.
36. Button weight: 600.
37. Chip font size: 12-13px.
38. Result intent copy: one line, no tutorial tone.
39. Main text must not wrap into awkward single words.
40. Search area must remain lower hierarchy than hero.
41. Placeholder includes product type.
42. Placeholder includes material.
43. Placeholder includes stone.
44. Placeholder includes budget.
45. Placeholder avoids long sentence structure.
46. Button label is direct action: "חיפוש".
47. Section heading is shopper intent, not feature explanation.
48. Suggested chips use terms customers search for.
49. Suggested chips include category.
50. Suggested chips include material.
51. Suggested chips include stone.
52. Suggested chips include price intent.
53. Input uses magnifying-glass icon.
54. Submit uses magnifying-glass icon.
55. Suggested chips may use small category icons.
56. Decorative icons are avoided.
57. Icons are stroke based.
58. Icon opacity is muted in input.
59. Button icon uses button foreground color.
60. Chip icons are optional and never larger than text.
61. Icon and text gap: 6-8px.
62. Icons never replace accessible label.
63. Background: white or near-white surface.
64. Outer panel background: same family as card/control tokens.
65. Border: cool neutral.
66. Accent: aqua only for primary action.
67. Placeholder: muted gray, sufficient contrast.
68. Input text: foreground token.
69. Button text: deep aqua/ink on aqua.
70. Chip background: transparent or low-alpha surface.
71. Chip border: low contrast neutral.
72. Hover chip background: muted, not saturated.
73. Focus ring: aqua at 30-45% opacity.
74. Avoid beige/tan search surface.
75. Avoid purple/blue gradient search surface.
76. Avoid dark filled input on light page.
77. Hover input: border strengthens.
78. Focus input: ring appears.
79. Active submit: moves 1px down or compresses subtly.
80. Disabled submit: opacity reduced.
81. Empty input submit remains allowed.
82. Filled input submit navigates to search query.
83. Chip hover gives under-1px lift or color only.
84. Chip active state does not shift layout.
85. Form submit preserves typed query.
86. Keyboard tab order: input, button, chips.
87. Enter in input submits.
88. Search icon is pointer-events none.
89. Click target: minimum 44px for primary controls.
90. Mobile chip wrapping remains within one or two lines.
91. Hover transition duration: 180-260ms.
92. Focus ring transition: immediate or under 160ms.
93. Button press animation: 80-140ms.
94. No continuous motion.
95. No scroll-linked motion in search control.
96. No shimmer.
97. No shine sweep.
98. No decorative gradient orb.
99. Respect reduced motion.
100. Motion never delays form submission.
101. Form has `role="search"`.
102. Form has clear aria-label.
103. Input has clear aria-label.
104. Submit is a real submit button.
105. Suggested chips are real links.
106. Focus state is visible on keyboard.
107. Contrast passes normal text thresholds.
108. Placeholder is not the only label.
109. Field is not visually ambiguous with page background.
110. Hit targets remain usable under large text mode.
111. Search form is server-navigation compatible.
112. No client JavaScript required for basic search.
113. URL query key remains `q`.
114. Suggested chips use `/search?q=...`.
115. No exact stock counts in quick search.
116. No filter option counts in quick search.
117. Layout stable before images load.
118. No nested card inside card.
119. The section remains compact enough that categories are hinted below.
120. Regression test should check control shape, chips, action, and source order.
