#!/usr/bin/env node

/**
 * IPTV Channel Manager
 * 
 * Usage:
 * node scripts/channel-manager.js add
 * node scripts/channel-manager.js list
 * node scripts/channel-manager.js remove "Channel Name"
 * node scripts/channel-manager.js import "path/to/playlist.m3u"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CHANNELS_FILE = path.join(__dirname, '../data/channels.json');

class ChannelManager {
    constructor() {
        this.channels = this.loadChannels();
    }

    loadChannels() {
        try {
            if (fs.existsSync(CHANNELS_FILE)) {
                const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading channels:', error.message);
        }
        return [];
    }

    saveChannels() {
        try {
            fs.writeFileSync(CHANNELS_FILE, JSON.stringify(this.channels, null, 2));
            console.log('✓ Channels saved successfully');
        } catch (error) {
            console.error('✗ Error saving channels:', error.message);
        }
    }

    addChannel(channel) {
        if (!channel.name || !channel.url) {
            console.error('✗ Channel must have name and URL');
            return false;
        }

        this.channels.push({
            name: channel.name,
            group: channel.group || 'Other',
            logo: channel.logo || 'https://via.placeholder.com/200x150?text=No+Image',
            url: channel.url
        });

        console.log(`✓ Added channel: ${channel.name}`);
        return true;
    }

    removeChannel(name) {
        const index = this.channels.findIndex(ch => ch.name === name);
        if (index > -1) {
            this.channels.splice(index, 1);
            console.log(`✓ Removed channel: ${name}`);
            return true;
        }
        console.error(`✗ Channel not found: ${name}`);
        return false;
    }

    listChannels() {
        if (this.channels.length === 0) {
            console.log('No channels found');
            return;
        }

        console.log('\n=== IPTV Channels ===\n');
        this.channels.forEach((ch, index) => {
            console.log(`${index + 1}. ${ch.name}`);
            console.log(`   Group: ${ch.group}`);
            console.log(`   URL: ${ch.url}`);
            console.log('');
        });
    }

    importM3U(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            let added = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.startsWith('#EXTINF')) {
                    const nameMatch = line.match(/,(.+)$/);
                    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                    const groupMatch = line.match(/group-title="([^"]+)"/);
                    
                    const url = lines[i + 1]?.trim();
                    
                    if (url && nameMatch) {
                        this.addChannel({
                            name: nameMatch[1].trim(),
                            group: groupMatch ? groupMatch[1] : 'Other',
                            logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/200x150?text=No+Image',
                            url: url
                        });
                        added++;
                    }
                    i++;
                }
            }

            console.log(`✓ Imported ${added} channels from M3U`);
            return added > 0;
        } catch (error) {
            console.error('✗ Error importing M3U:', error.message);
            return false;
        }
    }

    exportM3U(outputPath) {
        try {
            let m3u = '#EXTM3U\n';
            
            this.channels.forEach(ch => {
                m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.name}\n`;
                m3u += `${ch.url}\n`;
            });

            fs.writeFileSync(outputPath, m3u);
            console.log(`✓ Exported ${this.channels.length} channels to M3U`);
            return true;
        } catch (error) {
            console.error('✗ Error exporting M3U:', error.message);
            return false;
        }
    }

    getStats() {
        const categories = new Set(this.channels.map(ch => ch.group));
        console.log('\n=== Channel Statistics ===');
        console.log(`Total Channels: ${this.channels.length}`);
        console.log(`Categories: ${categories.size}`);
        console.log('\nChannels per category:');
        
        categories.forEach(cat => {
            const count = this.channels.filter(ch => ch.group === cat).length;
            console.log(`  ${cat}: ${count}`);
        });
    }
}

// Interactive mode
async function interactiveAdd() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => {
        rl.question(prompt, resolve);
    });

    try {
        const name = await question('Channel name: ');
        const url = await question('Stream URL (m3u8): ');
        const group = await question('Category (default: Other): ');
        const logo = await question('Logo URL (optional): ');

        const manager = new ChannelManager();
        manager.addChannel({
            name,
            url,
            group: group || 'Other',
            logo: logo || undefined
        });
        manager.saveChannels();
    } finally {
        rl.close();
    }
}

// Main
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const manager = new ChannelManager();

    switch (command) {
        case 'add':
            await interactiveAdd();
            break;
        case 'list':
            manager.listChannels();
            break;
        case 'remove':
            if (args[1]) {
                manager.removeChannel(args[1]);
                manager.saveChannels();
            }
            break;
        case 'import':
            if (args[1]) {
                if (manager.importM3U(args[1])) {
                    manager.saveChannels();
                }
            }
            break;
        case 'export':
            if (args[1]) {
                manager.exportM3U(args[1]);
            }
            break;
        case 'stats':
            manager.getStats();
            break;
        default:
            console.log('IPTV Channel Manager');
            console.log('\nUsage:');
            console.log('  node scripts/channel-manager.js add          - Add channel interactively');
            console.log('  node scripts/channel-manager.js list         - List all channels');
            console.log('  node scripts/channel-manager.js remove "Name"- Remove channel');
            console.log('  node scripts/channel-manager.js import file  - Import from M3U');
            console.log('  node scripts/channel-manager.js export file  - Export to M3U');
            console.log('  node scripts/channel-manager.js stats        - Show statistics');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ChannelManager;
