import sys

sys.path.insert(0, r"C:\Users\beaga\.codex\plugins\cache\openai-primary-runtime\presentations\26.819.11345\skills\presentations\container_tools")
from render_slides import convert_to_pdf

result = convert_to_pdf(
    r"D:\Projects\PomodoroDesktopApp\pomodoro-clock\output\gcash-teamline-locked-in-v2.pptx",
    "",
    r"D:\Projects\PomodoroDesktopApp\pomodoro-clock\output",
    "gcash-teamline-locked-in-v2",
)
print(result)
