-- ============================================
-- TRPG 跑团系统 - 数据库迁移 v2
-- 房间系统 + 历史消息加载
-- ============================================

-- 1. 新建 rooms 表
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL DEFAULT 'COC',
    max_players INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'waiting',
    owner_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 给 players 表加 room_id 和 is_owner
ALTER TABLE players ADD COLUMN IF NOT EXISTS room_id BIGINT REFERENCES rooms(id);
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '离线';

-- 3. 给 messages 表加 room_id、kp_processed、target_player
ALTER TABLE messages ADD COLUMN IF NOT EXISTS room_id BIGINT REFERENCES rooms(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS kp_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS target_player TEXT;

-- 4. 为常用查询建索引
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_kp ON messages(sender_name, kp_processed);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 5. RLS 策略
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on rooms" ON rooms;
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on players" ON players;
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on messages" ON messages;
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
