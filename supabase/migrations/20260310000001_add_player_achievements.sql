-- Create player_achievements table for tracking badges and milestones
CREATE TABLE IF NOT EXISTS player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  category_id UUID REFERENCES tournament_categories(id) ON DELETE SET NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- Additional data like match count, score, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure user can't get same achievement for same tournament twice
  CONSTRAINT unique_user_tournament_achievement UNIQUE (user_id, achievement_type, tournament_id)
);

-- Achievement types:
-- 'champion' - Won a tournament
-- 'runner_up' - Second place in tournament
-- 'third_place' - Third place in tournament
-- 'perfect_record' - Won all matches in a series
-- 'first_tournament' - First tournament participation
-- 'veteran_5' - Participated in 5 tournaments
-- 'veteran_10' - Participated in 10 tournaments
-- 'comeback_king' - Won match after losing first set
-- 'dominator' - Won match 2-0 or 3-0
-- 'top_scorer' - Most points in category

-- Indexes for performance
CREATE INDEX idx_player_achievements_user_id ON player_achievements(user_id);
CREATE INDEX idx_player_achievements_type ON player_achievements(achievement_type);
CREATE INDEX idx_player_achievements_tournament ON player_achievements(tournament_id);

-- RLS Policies
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view player achievements"
  ON player_achievements
  FOR SELECT
  USING (true);

-- Only system can create achievements (via service role)
-- Players cannot manually create their own achievements
CREATE POLICY "Only service role can create achievements"
  ON player_achievements
  FOR INSERT
  WITH CHECK (false);

-- Only admins can delete achievements if needed
CREATE POLICY "Only admins can delete achievements"
  ON player_achievements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

COMMENT ON TABLE player_achievements IS 'Tracks player achievements and badges earned in tournaments';
COMMENT ON COLUMN player_achievements.achievement_type IS 'Type of achievement earned (champion, runner_up, veteran_5, etc.)';
COMMENT ON COLUMN player_achievements.metadata IS 'Additional data about the achievement (e.g., match count, final score)';
