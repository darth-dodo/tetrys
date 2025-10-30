# Working Hours Commit Analysis Prompt

Use this prompt in any git repository to analyze whether commits were made during traditional working hours (Monday-Friday, 8am-4pm).

---

## Prompt Template

```
Analyze the git commit history of this repository to determine if any commits were made during traditional working hours (Monday-Friday, 8am-4pm).

Please provide:

1. A clear YES/NO answer on whether commits exist during working hours
2. A breakdown of commits by:
   - Day of week (Monday-Sunday)
   - Hour of day (0-23)
   - Weekday vs weekend distribution
3. Identification of peak coding times
4. A summary analysis of the commit pattern (e.g., personal project, work project, etc.)

Use Python with git log to analyze the commit timestamps and create visualizations with text-based charts.
```

---

## Python Analysis Script

Save this as `analyze_commits.py` in any repository:

```python
#!/usr/bin/env python3
"""
Git Commit Working Hours Analysis
Analyzes repository commits to identify working hours patterns
"""

import subprocess
from datetime import datetime
from collections import defaultdict
import sys

def get_all_commits():
    """Get all commit timestamps from git log"""
    result = subprocess.run(
        ['git', 'log', '--all', '--pretty=format:%ai'],
        capture_output=True,
        text=True,
        cwd='.'
    )

    if result.returncode != 0:
        print("Error: Not a git repository or git not found")
        sys.exit(1)

    return result.stdout.strip().split('\n')

def analyze_commits(timestamps):
    """Analyze commit patterns"""
    day_count = defaultdict(int)
    hour_count = defaultdict(int)
    weekday_hours = defaultdict(int)
    working_hours_commits = []

    for ts_str in timestamps:
        if not ts_str:
            continue

        dt = datetime.strptime(ts_str[:19], '%Y-%m-%d %H:%M:%S')
        day_name = dt.strftime('%A')

        day_count[day_name] += 1
        hour_count[dt.hour] += 1

        is_weekday = dt.weekday() < 5  # 0=Monday, 6=Sunday
        is_working_hours = 8 <= dt.hour < 16

        if is_weekday:
            weekday_hours[dt.hour] += 1

            if is_working_hours:
                working_hours_commits.append({
                    'timestamp': dt,
                    'day': day_name,
                    'hour': dt.hour
                })

    return day_count, hour_count, weekday_hours, working_hours_commits

def print_analysis(day_count, hour_count, weekday_hours, working_hours_commits, total_commits):
    """Print formatted analysis results"""

    print("\n" + "="*70)
    print("📊 GIT COMMIT WORKING HOURS ANALYSIS")
    print("="*70)

    # Working hours verdict
    print("\n🎯 VERDICT:")
    if working_hours_commits:
        print(f"  ✅ YES - {len(working_hours_commits)} commits during working hours")
        print(f"     ({len(working_hours_commits)/total_commits*100:.1f}% of total)")
    else:
        print("  ❌ NO - Zero commits during working hours (Mon-Fri 8am-4pm)")

    # Day of week breakdown
    print("\n📅 COMMITS BY DAY OF WEEK:")
    print("-" * 70)
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    for day in days_order:
        count = day_count.get(day, 0)
        bar = '█' * count
        percentage = (count / total_commits * 100) if total_commits > 0 else 0
        work_indicator = '(workday)' if day not in ['Saturday', 'Sunday'] else '(weekend)'
        print(f"  {day:9} {work_indicator:10} {count:3} ({percentage:4.1f}%) {bar}")

    # Hour breakdown
    print("\n⏰ COMMITS BY HOUR (24-hour format):")
    print("-" * 70)

    working_hours_total = 0
    for hour in range(24):
        count = hour_count.get(hour, 0)
        weekday_count = weekday_hours.get(hour, 0)
        bar = '█' * min(count, 50)  # Cap visualization

        if 8 <= hour < 16:
            status = '← WORKING HOURS'
            working_hours_total += weekday_count
        elif 16 <= hour < 18:
            status = '← After work'
        elif 18 <= hour < 22:
            status = '← Evening'
        elif 22 <= hour or hour < 6:
            status = '← Late night'
        else:
            status = '← Morning'

        if count > 0:
            print(f"  {hour:02d}:00  {count:3} commits {bar:20} (weekdays: {weekday_count:2}) {status}")

    # Summary statistics
    print("\n" + "="*70)
    print("📊 SUMMARY STATISTICS:")
    print("-" * 70)

    weekday_total = sum(day_count[d] for d in days_order[:5])
    weekend_total = sum(day_count[d] for d in days_order[5:])

    print(f"  Total commits analyzed:           {total_commits}")
    print(f"  Weekday commits (Mon-Fri):        {weekday_total} ({weekday_total/total_commits*100:.1f}%)")
    print(f"  Weekend commits (Sat-Sun):        {weekend_total} ({weekend_total/total_commits*100:.1f}%)")
    print(f"  Working hours (Mon-Fri 8am-4pm):  {working_hours_total} ({working_hours_total/total_commits*100:.1f}%)")

    # Peak times
    if hour_count:
        peak_hour = max(hour_count.items(), key=lambda x: x[1])
        peak_day = max(day_count.items(), key=lambda x: x[1])
        print(f"\n  Peak coding hour:                 {peak_hour[0]:02d}:00 ({peak_hour[1]} commits)")
        print(f"  Most active day:                  {peak_day[0]} ({peak_day[1]} commits)")

    # Pattern interpretation
    print("\n🔍 PATTERN INTERPRETATION:")
    print("-" * 70)

    work_hour_ratio = working_hours_total / total_commits if total_commits > 0 else 0
    weekend_ratio = weekend_total / total_commits if total_commits > 0 else 0

    if work_hour_ratio > 0.5:
        interpretation = "  📋 Work project - Most commits during business hours"
    elif work_hour_ratio > 0.2:
        interpretation = "  🔀 Mixed project - Commits during and after work hours"
    elif weekend_ratio > 0.5:
        interpretation = "  🏠 Weekend hobby project - Primary development on weekends"
    elif weekday_total > weekend_total and work_hour_ratio < 0.1:
        interpretation = "  🌙 Evening side project - Weeknight development after work"
    else:
        interpretation = "  🎯 Personal project - Non-traditional working hours"

    print(interpretation)

    # Detailed working hours commits if found
    if working_hours_commits:
        print("\n⚠️  WORKING HOURS COMMITS DETAILS:")
        print("-" * 70)
        for commit in working_hours_commits[:10]:  # Show first 10
            print(f"  {commit['timestamp'].strftime('%Y-%m-%d %H:%M')} | {commit['day']:9} | Hour: {commit['hour']:02d}")

        if len(working_hours_commits) > 10:
            print(f"  ... and {len(working_hours_commits) - 10} more")

    print("="*70 + "\n")

def main():
    """Main execution"""
    print("Analyzing git repository commit patterns...")

    timestamps = get_all_commits()
    total_commits = len([t for t in timestamps if t])

    if total_commits == 0:
        print("No commits found in repository")
        return

    day_count, hour_count, weekday_hours, working_hours_commits = analyze_commits(timestamps)
    print_analysis(day_count, hour_count, weekday_hours, working_hours_commits, total_commits)

if __name__ == "__main__":
    main()
```

---

## Usage Instructions

### Option 1: Direct Prompt (Quick)
1. Navigate to any git repository
2. Paste the prompt template into Claude Code
3. Get immediate analysis

### Option 2: Python Script (Detailed)
1. Save the Python script to repository root as `analyze_commits.py`
2. Make executable: `chmod +x analyze_commits.py`
3. Run: `python3 analyze_commits.py`

### Option 3: One-liner Command
```bash
cd /path/to/repository && python3 << 'PYEOF'
# [Paste the Python script content here]
PYEOF
```

---

## What It Detects

✅ **Working Hours Definition:**
- Days: Monday through Friday
- Time: 8:00 AM to 4:00 PM (16:00)
- Timezone: Uses commit's local timezone

✅ **Analysis Includes:**
- Day of week distribution
- Hour of day patterns
- Weekday vs weekend breakdown
- Peak coding times
- Project type interpretation

✅ **Pattern Types:**
- **Work project**: >50% commits during business hours
- **Mixed project**: 20-50% during business hours
- **Side project**: <10% during business hours, weeknight focus
- **Hobby project**: Weekend and evening focus

---

## Example Output

```
📊 GIT COMMIT WORKING HOURS ANALYSIS
======================================================================

🎯 VERDICT:
  ❌ NO - Zero commits during working hours (Mon-Fri 8am-4pm)

📅 COMMITS BY DAY OF WEEK:
----------------------------------------------------------------------
  Monday    (workday)      5 (16.7%) █████
  Tuesday   (workday)      8 (26.7%) ████████
  Wednesday (workday)      0 ( 0.0%)
  Thursday  (workday)      0 ( 0.0%)
  Friday    (workday)      0 ( 0.0%)
  Saturday  (weekend)      0 ( 0.0%)
  Sunday    (weekend)     17 (56.7%) █████████████████

📊 SUMMARY STATISTICS:
----------------------------------------------------------------------
  Total commits analyzed:           30
  Weekday commits (Mon-Fri):        13 (43.3%)
  Weekend commits (Sat-Sun):        17 (56.7%)
  Working hours (Mon-Fri 8am-4pm):  0 (0.0%)

  Peak coding hour:                 17:00 (9 commits)
  Most active day:                  Sunday (17 commits)

🔍 PATTERN INTERPRETATION:
----------------------------------------------------------------------
  🏠 Weekend hobby project - Primary development on weekends
```

---

## Notes

- Analysis uses commit author date (not committer date)
- Timezone is preserved from original commits
- Empty commits are excluded from analysis
- Script requires Python 3.6+ and git
- Works with any git repository size

---

## Customization

Modify working hours definition in the script:

```python
# Change these values as needed
WORK_START_HOUR = 8   # 8am
WORK_END_HOUR = 16    # 4pm (exclusive)
WORK_DAYS = [0, 1, 2, 3, 4]  # Monday=0, Sunday=6
```
